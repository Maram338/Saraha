import * as db_service from "../../DB/db.service.js"
import userModel from "../../DB/models/user.model.js"
import messageModel from "../../DB/models/message.model.js"
import { successResponse } from "../../utils/respose.success.js"

export const sendMessage = async (req,res,next) => {
    const {content, userId} = req.body
    const user = await db_service.findById({
        model:userModel,
        id:userId
    })
    if(!user){
        throw new Error("user not found")
    }

    let arr = []
    if(req.files?.length){ 
        for (const file of req.files) {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "saraha/messages" },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                )
                stream.end(file.buffer)
            })
            arr.push({
                secure_url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            })
        }
    }

    const message = await db_service.create({
        model:messageModel,
        data:{
            content,
            userId:user._id,
            attachments: arr
        }
    })
    successResponse({res, status:201, data: message})
}

export const getMessage = async (req,res,next) => {
    const {messageId} = req.params

    const message = await db_service.findOne({
        model:messageModel,
        filter:{
            _id: messageId, 
            userId: req.user._id
        }
    })

    if(!message){
        throw new Error("message not found")
    }
   
    successResponse({res, status:201, data: message})
}
export const getAllMessages = async (req,res,next) => {

    const messages = await db_service.find({
        model:messageModel,
        filter:{
            userId: req.params.userId
        }
    })

    if(!messages){
        throw new Error("message not found")
    }
   
    successResponse({res, status:201, data: messages})
}