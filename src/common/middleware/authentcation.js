import ur from "../../database/repo/user.repo.js"
import { BadRequestException, NotFoundException, UnauthorizedException } from "../utils/exceptions.js"
import { verifyToken } from "../security/jwt.js"
import { tokenTypeEnum } from "../enums/tokenType.enum.js"
import { authEnum } from "../enums/auth.enum.js"
import { myCompare } from "../security/hash.js"
import { HashEnum } from "../enums/hash.enum.js"


export const auth = ({tokenType = tokenTypeEnum.ACCESS})=>{
    return async (req,res,next)=>{
    let [prefix, token]= req.headers.authorization.split(" ")
    if(!token){
        BadRequestException("token not provided")
    }

    switch (prefix){
        case authEnum.basic:
            let data = Buffer.from(token , "base64").toString()
            console.log({data})
            let [email , password] = data.split(":")
            let user = await ur.findOne({filter : {email}})
            if(!user) NotFoundException("user not found")
                
            if(!await myCompare({plainText: password, encrypted: user.password ,lib: HashEnum.argon2})) NotFoundException("user not found")
            req.user = user
            next()

        break

        case authEnum.Bearer:

            let payload = verifyToken({
                token,
                tokenType
            })
            req.user = await ur.findById({id : payload.sub})
            req.payload = payload
            next()
            break

        default:
            BadRequestException("Invalid auth method")
            break;
    }

    }
}