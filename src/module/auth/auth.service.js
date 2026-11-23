import { exceptions, logoutEnum } from "../../common/index.js"
import { myHash } from "../../common/security/index.js"
import { HashEnum, myCompare } from "../../common/index.js"
import { encryption } from "../../common/security/encryption.js"
import { createTokens } from "../../common/security/jwt.js"
import { BadRequestException, ConflictException, NotFoundException, TooManyRequests, UnauthorizedException } from "../../common/utils/exceptions.js"
import {OAuth2Client} from 'google-auth-library'
import configService from "../../config/config.service.js"
import ur from "../../database/repo/user.repo.js"
import { delByPrefix, set ,get ,del, incrBy ,ttl} from "../../common/service/cache.service.js"
import { userBlockKey, userKeyBase, userOtpKey, userOtpTrailsKey, userRevokeKey, userSubjectedOtpKey, userWrongOtpTrailsKey } from "../../common/service/cacheKeys.service.js"
import { emailEvents } from "../../common/events/email.events.js"
import { emailEventsEnum } from "../../common/enums/emailEvents.enum.js"



const client = new OAuth2Client()



export const signup = async (data) => {
    let exists = await ur.findOne({
        filter: { email: data.email },
        projection: { email: 1 }
    })

    if (exists) exceptions.ConflictException("user already exists")
    data.password = await myHash({plainText: data.password, lib: HashEnum.argon2 })
    data.phone = encryption(data.phone)
    let user = await ur.create({ data })
    await createAndSendOtp({user , subject: emailEventsEnum.SIGNUP})
    
    return user
}

const createAndSendOtp = async({user,subject , maxTrails =5 , blockDuration = 900 })=>{
    let userId = user._id.toString()


    let currentBlockTtl = await ttl({key :userBlockKey({userId , subject})})
    if(currentBlockTtl > 0){
        UnauthorizedException(`You cant request new otp , please try again after ${Math.ceil(currentBlockTtl / 60)} minutes`)
    }

    let otp = Math.trunc(Math.random() * 10000).toString().padStart(4, "0")
    let userTrails = await get({key : userOtpTrailsKey({userId, subject })})
    if(Number(userTrails) >= maxTrails){
        await set({
            key : userBlockKey({userId , subject}),
            value : 1,
            ttl : blockDuration
        })
        TooManyRequests(`Too many requests, try again after ${Math.ceil(blockDuration / 60)} minutes`)
    }
    await set({
        key: userSubjectedOtpKey({userId, subject}),
        value: otp,
        ttl: 300
    })

    emailEvents.emit(subject , {
        receivers: { to: user.email },
        otp
    })
    await incrBy({key : userOtpTrailsKey({userId, subject }) })
}


export const login = async ({ email, password }) => {
    let user = await ur.findOne({filter:{email}, options: {lean:true}})
    console.log(user)
    if (!user) exceptions.NotFoundException("user not found")
    if (!user.confirmEmail) 
        await createAndSendOtp({user , subject : emailEventsEnum.SIGNUP})
        ForbiddenException("user not confirmed , check your email")
    let matchPassword = await myCompare({ plainText: password, encrypted: user.password, lib: HashEnum.argon2 })
    if (!matchPassword) exceptions.NotFoundException("user not found")

    let tokens = createTokens({
        payload: {},
        options: { subject: user.id || user._id.toString(), issuer: "ali" },
        role: user.role
    })

    return tokens
}


export const rotateToken =async(user, payload) => {
    let accessIAT = payload.iat * 1000
    let accessExpIn = configService.JWT_ACCESS_EXP * 1000
    let accessExpAt = accessExpIn + accessIAT
    let currTime = Date.now()

    if (currTime < accessExpAt) {
        ConflictException("access token still valid")
    }

    let { accessToken, refreshToken} = createTokens({
        options : {subject: user.id, issuer:"ali", audience: ["admin" , "user"]}
    })

    await revokeTokens(payload)

    return createTokens({
        options: { subject: user._id.toString(), issuer: "ali" },
        role: user.role
    })
}


export const loginWithGmail =async (data)=>{ 
    const ticket = await client.verifyIdToken({
        idToken: data.idToken,
        audience: configService.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    let {email , email_verified , picture , name } = payload
    if(!email_verified) UnauthorizedException("this email is not verified")
    let status = 200
    let user = await ur.findOne({filter : {email}})

    if(!user){
        user = await ur.create({data:{email , image : picture , userName : name }})
        status = 201
    }
    return {tokens : createTokens({
        options: { subject: user.id || user._id.toString(), issuer: "ali" , audience: [user.role] },
        role: user.role
    }), status}
}



export const logout = async (payload ,{action = logoutEnum.DEVICE}) => {
    switch(action){
        case logoutEnum.DEVICE:
            return await revokeTokens(payload)
            break
        default :
        await ur.updateOne({filter:{_id:payload.sub} , update :{changeCredenitalsAt :Date.now()}})
        await delByPrefix({prefix :userKeyBase({userId : payload.sub}) })
        return
        break
    }
}

const revokeTokens = async(payload)=>{
    let {exp , jti , sub} = payload
    let nowInSec = Math.ceil(Date.now() / 1000)
    let ttl = exp - nowInSec 
    await set({
        key : userRevokeKey({userId : sub , jti}),
        value : jti,
        ttl 
    })
    return {...payload , nowInSec , ttl}
}


export const confirmEmail = async ({ email, otp })=>{
    try{
        let user = await ur.findOne({filter:{email}})
        if (!user) {
            NotFoundException("user not found")
        }
        let userId  = user._id.toString()
        let subject = emailEventsEnum.SIGNUP

        await verifyOtp({userId, subject ,otp})


        user.confirmEmail = new Date()
        await user.save()
        await delByPrefix({prefix : userBlockKey({userId , subject })})
        return
    }catch(e){
        throw e
    }
}



export const resendOtp =async ({email,subject})=>{
    let user = await ur.findOne({
        filter :{
            $and:[
                {email} , 
                {$or : [
                    {confirmEmail :{$exists :false}} ,
                    {confirmEmail : {$eq : null}}
                ]}
            ]
        }
    })
    if(!user) NotFoundException("user not found or already confirmed")
    
    let otpExists = await ttl({key : userSubjectedOtpKey({userId: user._id.toString(), subject})})
    if(otpExists > 0)ConflictException("old otp still valid")
    
    await createAndSendOtp({user ,subject})
}


export const forgetPassword = async({email})=>{
    // let user = await ur.findOne({filter : {email}})
    let user = await ur.findOne({filter :{email , confirmEmail: {$exists: true}}
    })

    if(!user){
        NotFoundException("user not found or not confirmed")
    }


    await createAndSendOtp({
        user , subject: emailEventsEnum.FORGET
    })
}


export const verifyForgetPassword = async({email ,otp})=>{
    let user = await ur.findOne({filter : {email}})
    if(!user){
        NotFoundException("user not found")
    }

    let userId = user._id.toString()
    let subject = emailEventsEnum.FORGET
    await verifyOtp({
        userId ,subject , otp
    })

    await set({
        key: userSubjectedOtpKey({userId , subject}),
        value: otp,
        ttl: 300
    })

    return user 
}


export const resetPassword = async({email , otp , newPassword})=>{
    let user = await verifyForgetPassword({email ,otp})
    let userId = user._id.toString()
    let subject = emailEventsEnum.FORGET
    user.password = await myHash({plainText : newPassword, lib: HashEnum.argon2})
    await user.save()
    await delByPrefix({prefix : userBlockKey({userId , subject })})

    return {message : "done"}
} 


const verifyOtp = async({userId , subject ,otp})=>{
    let blockedUntil = await ttl({key : userBlockKey({userId , subject})})
        if(blockedUntil > 0){
        UnauthorizedException(`please try again after ${Math.ceil(blockedUntil / 60)} minutes`)
    }

        let WrongOtpTrails = await get({
            key : userWrongOtpTrailsKey({ userId ,subject})
        })

        if(WrongOtpTrails >= 5){
            await set({
                key : userBlockKey({userId , subject}),
                value : 1,
                ttl : 900
            })
            TooManyRequests("Too many requests try again after 15 minutes")
        }
        
        let stored = await get({ 
            key: userSubjectedOtpKey({userId , subject }),
        })

        if (stored != otp) {
            await incrBy({
                key : userWrongOtpTrailsKey({userId , subject})
            })
            BadRequestException("wrong otp")
        }
}