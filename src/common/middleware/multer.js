import multer from "multer"
import fs from "node:fs"
import  fsPromises  from "node:fs/promises"
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type"
import { BadRequestException } from "../utils/exceptions.js"



export let fileTypes = {
    image : ["image/jpeg" , "image/jpg" , "image/png" ],
    pdf : ["application/pdf"]
}

export const multerMiddleWare = ({storageFolder = "general" , types = fileTypes.image ,maxFileSize = 5})=>{
    let storage = multer.diskStorage({
        destination : function(req ,file,cb){
            let folderPath = "./uploads/" + storageFolder
            if(!fs.existsSync(folderPath)){
                fs.mkdirSync(folderPath , {recursive : true})
            }
            cb(null , folderPath)
        },
        filename : function(req,file,cb){
            cb(null , Date.now()+"-" +file.originalname)
        }
    })


    let memStorage = multer.memoryStorage()

    let fileFilter = function(req , file ,cb){
        if(!types.includes(file.mimetype)){
            cb(new Error("not allowed file type"), false)
        }
        cb(null ,true)
    }
    return multer({
        storage: memStorage ,fileFilter ,limits:{
            fileSize : maxFileSize * 1024 * 1024
        }
    })
}


export const processFile = ({types = fileTypes.image ,storageFolder="general"})=>{
    return async(req,res,next)=>{
        if(req.file){
            req.file = await checkFile({file ,storageFolder ,types })
        }else if(Array.isArray(req.files) && req.files.length > 0){
            let data = []
            for(const file of req.files){
                data.push(checkFile({ file ,storageFolder ,types}))
            }
            req.files = await Promise.all(data)
        }else if(typeof req.files == "object" && Object.keys(req.files).length > 0){
            
        }
        next()
    }
}


const checkFile = async({file , storageFolder ,types })=>{
    let result 
        if(file.buffer){
            result = await fileTypeFromBuffer(file.buffer)
        }else{
            result = await fileTypeFromFile(file.path)

        }
        if(!types.includes(result.mime) || file.mimetype !== result.mime){
            file.path && fs.unlinkSync(file.path)
            BadRequestException("not allowed type")
        }
        if(file.buffer){
            let dirPath = `./uploads/${storageFolder}`
            let fullPath = `${dirPath}/${Date.now()}-${file.originalname}`
            if(!fs.existsSync(dirPath)){
                fs.mkdirSync(dirPath , {recursive : true})
            }
            fs.writeFileSync(fullPath , file.buffer)
            file.path = fullPath
        }
        return file
}