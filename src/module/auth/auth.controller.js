import {Router} from "express"
import * as as from "./auth.service.js"
import {response, tokenTypeEnum} from "../../common/index.js"
import {auth} from "../../common/middleware/authentcation.js"
import { loginSchema, signupSchema } from "./auth.validation.js"
import { langEnum } from "../../common/index.js"
import { validation } from "../../common/middleware/validation.js"


export const authController = Router()

authController.post("/signup", validation(signupSchema), async(req,res,next)=>{
    let user = await as.signup(req.validate)
    response({
        res, data:user, status:201, message:"user created"
    })
})


authController.post("/login", validation(loginSchema), async(req,res,next)=>{
    let user = await as.login(req.validate)
    response({
        res, data:user, status:200, message:"user logged in"
    })
})


authController.post("/rotate-token", auth({ tokenType :tokenTypeEnum.REFRESH}), async (req, res, next)=>{
    let tokens = await as.rotateToken(req.user , req.payload )
    response({
        res ,  data:tokens , status :200 , message : "token rotated"
    })
})


authController.post("/loginWithGmail" , async (req,res,next)=>{
    let {tokens , status} = await  as.loginWithGmail(req.body)
    response({
        res ,  data:tokens , status, message : status == 200? "user logged in" : "user created"
    })
})