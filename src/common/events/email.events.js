import { EventEmitter } from "node:events";
import { emailEventsEnum } from "./../index.js";
import { sendMail } from "../service/mail.service.js";
import { emailTemplate } from "../templates/templates.js";


export const emailEvents = new EventEmitter()

emailEvents.on(emailEventsEnum.SIGNUP ,async({receivers , otp})=>{
    try{
        await sendMail({
            receivers,
            subject:"Confirm email",
            html: emailTemplate({
                title: "Confirm email",
                message : "Confirm your email",
                otp
            })
        })
    }catch(e){
        console.error(e)
    }
})


emailEvents.on(emailEventsEnum.FORGET ,async({receivers , otp})=>{
    try{
        await sendMail({
            receivers,
            subject:"Forget password",
            html: emailTemplate({
                title: "Forget password",
                message : "Reset your password",
                otp
            })
        })
    }catch(e){
        console.error(e)
    }
})