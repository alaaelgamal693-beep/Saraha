import {createTransport} from "nodemailer";
import configService from "../../config/config.service.js";



export const transporter = createTransport({
    service : "gmail",
    auth : {
        user: configService.EMAIL_USER,
        pass: configService.EMAIL_PASS
    }
})


try {
    await transporter.verify()
    console.log("server is ready to take out messages")
} catch (err){
    console.log("Verification failed" ,err)
}


export const sendMail=async({
    receivers,
    subject,
    html
})=>{
try{
    let info =  await transporter.sendMail({
        from : "Saraha",
        ...receivers,
        subject,
        html
    })
    console.log(info)
}catch(e){
    console.error(e)
}
}

