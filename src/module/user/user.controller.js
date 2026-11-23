import { Router } from "express"
import * as us from "./user.service.js"
import { response, RoleEnum, tokenTypeEnum, validation } from "../../common/index.js"
import { auth } from "../../common/middleware/authentcation.js"
import { authorization } from "../../common/middleware/authorization.js"
import { userProfileSchema } from "./user.validation.js";
import { fileTypes, multerMiddleWare, processFile } from "../../common/middleware/multer.js"

export const userController = Router()

userController.get("/profile", auth({ tokenType: tokenTypeEnum.ACCESS }), async (req, res,next) => {
    response({ 
        res, data: req.user, message: "user fetched" })
})


userController.get("/user-profile/:userId", validation(userProfileSchema), async (req, res, next) => {
    let user = await us.getUserProfile(req.validate.params.userId)
    response({ 
        res, data: user, message: "user fetched" })
})

userController.get("/admin-profile",auth({ tokenType: tokenTypeEnum.ACCESS }), authorization([RoleEnum.admin]), async (req, res, next) => {
        response({ 
            res, data: req.user, message: "user fetched" })
    }
)

userController.patch("/update-user", auth({}), async (req, res, next) => {
    let user = await us.updateUser(req.user)
    response({ 
        res, data: user, message: "user updated in" })
})


userController.post("/image", multerMiddleWare({storageFolder :"users" , types : fileTypes.image}).array("image" ,5),processFile({storageFolder :"users" , types : fileTypes.image}), async (req, res, next) => {
    console.log({
        file : req.file,
        files : req.files
    })
    response({ 
        res, data: {f :req.files , b : req.body}, message: "user updated in" })
})

userController.post("/rotate-token",auth({ tokenType: tokenTypeEnum.REFRESH }),async (req, res) => {
        const tokens = us.rotateToken(req.user, req.payload)
        response({ res, data: tokens, message: "token rotated" })
    }
)