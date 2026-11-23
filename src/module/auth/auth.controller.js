import {Router} from "express"
import * as as from "./auth.service.js"
import {response, tokenTypeEnum} from "../../common/index.js"
import {auth} from "../../common/middleware/authentcation.js"
import { loginSchema, signupSchema } from "./auth.validation.js"
import { langEnum } from "../../common/index.js"
import { validation } from "../../common/middleware/validation.js"


export const authController = Router()

authController.post("/signup", validation(signupSchema), async(req,res,next)=>{
    let user = await as.signup(req.validate.body)
    response({
        res, data:user, status:201, message:"user created"
    })
})


authController.post("/login", validation(loginSchema), async(req,res,next)=>{
    let user = await as.login(req.validate.body)
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


authController.post("/logout", auth({ tokenType: tokenTypeEnum.REFRESH }), async (req, res, next) => {
    await as.logout(req.payload ,req.body)
    response({
        res,
    })
})


authController.post("/confirm-email" , async(req,res,next)=>{
    let data = await as.confirmEmail(req.body)


    response({
        res,
        message: "Your email confirmed"
    })
})


authController.post("/resend-otp" , async(req,res,next)=>{
    let data = await as.resendOtp(req.body)


    response({
        res,
        message: "New email send"
    })
})


authController.post("/forget-password" , async(req,res,next)=>{
    let data = await as.forgetPassword(req.body)


    response({
        res,
        message: "New email send"
    })
})


authController.post("/verify-forget-password-otp" , async(req,res,next)=>{
    let data = await as.verifyForgetPassword(req.body)


    response({
        res,
        message: "done",
        data
    })
})


authController.post("/reset-password" , async(req,res,next)=>{
    let data = await as.resetPassword(req.body)


    response({
        res,
        message: "done",
        data
    })
})