import express from 'express';
import configService from "./config/config.service.js"
import {dbconnect} from "./database/connection.js"
import {errorHandler} from "./common/index.js"
import {authController} from "./module/auth/auth.controller.js"
import { userController } from './module/user/user.controller.js'
import {transporter} from "./common/index.js"
import cors from "cors"


const app = express()
const port = configService.port

await dbconnect()



app.use(cors() , express.json())



app.use("/auth", authController)
app.use("/user", userController)


app.get("/",(req, res) =>{
    res.status(200).json({
        message: "i'm good"
    })
})

app.use(errorHandler)

app.listen(port, () =>{
    console.log(`server is running on port ${port}`)
})

