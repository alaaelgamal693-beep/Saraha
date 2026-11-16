import { exceptions } from "../../common/index.js"
import { myHash } from "../../common/security/index.js"
import { HashEnum, myCompare } from "../../common/index.js"
import { encryption } from "../../common/security/encryption.js"
import { createTokens } from "../../common/security/jwt.js"
import { ConflictException, UnauthorizedException } from "../../common/utils/exceptions.js"
import {OAuth2Client} from 'google-auth-library'
import configService from "../../config/config.service.js"
import ur from "../../database/repo/user.repo.js"


const client = new OAuth2Client()


export const signup = async (data) => {
    let exists = await ur.findOne({
        filter:{email: data.email},
        projection:{email:1}
    })
    if (exists) exceptions.ConflictException("user already exists")
    data.password = await myHash({ plainText: data.password, lib: HashEnum.argon2 })
    data.phone = encryption(data.phone)
    let user = await ur.create({data})
    return user
}

export const login = async ({ email, password }) => {
    let user = await ur.findOne({filter:{email}, projection:{email: 1 , password: 1}, options: {lean:true}})
    console.log(user)
    if (!user) exceptions.NotFoundException("user does not exist")
    let matchPassword = await myCompare({ plainText: password, encrypted: user.password, lib: HashEnum.argon2 })
    if (!matchPassword) exceptions.NotFoundException("user not found")

    let tokens = createTokens({
        payload: {},
        options: { subject: user.id || user._id.toString(), issuer: "ali" },
        role: user.role
    })

    return tokens
}


export const rotateToken = (user, payload) => {
    let accessIAT = payload.iat * 1000
    let accessExpIn = configService.JWT_ACCESS_EXP * 1000
    let accessExpAt = accessExpIn + accessIAT
    let currTime = Date.now()

    if (currTime < accessExpAt) {
        ConflictException("access token still valid")
    }

    return createTokens({
        options: { subject: user._id.toString(), issuer: "ali" },
        role: user.role
    })
}


export const loginWithGmail =async (data)=>{
    console.log(data)
    console.log(configService.GOOGLE_CLIENT_ID)
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


