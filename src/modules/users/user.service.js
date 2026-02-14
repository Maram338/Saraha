import { providerEnum } from "../../common/enum/user.enum.js"
import * as db_service from "../../DB/db.service.js"
import userModel from "../../DB/models/user.model.js"
import { successResponse } from "../../utils/respose.success.js"
import { decrypt, encrypt } from "../../utils/security/encrypt.security.js"
import { Copmpare, Hash } from "../../utils/security/hash.security.js"
import { v4 as uuidv4 } from "uuid"
import { generateToken } from "../../utils/token.service.js"


export const signUp = async (req, res, next) => {
    const {userName, email, password, gender,phone} = req.body

    if( await db_service.findOne({
        model:userModel,
        filter: {email}
    }) 
    ){
        throw new Error("email already exists")  
    }

    const user = await db_service.create({model: userModel,
         data:{
            userName,
            email,
            password: Hash({plainText: password}),
            gender,
            phone:encrypt(phone)} 
        })
    successResponse({res,status:201, data: user})
}

export const signIn = async (req,res,next)=>{

    const {email, password} = req.body;

    const user = await db_service.findOne({
        model: userModel,
        filter: {email, provider:providerEnum.system}
    })
    if(!user){
        throw new Error("user doesn't exist")
    }
    const match = Copmpare({plainText: password, cipherText: user.password})
    if(!match){
        throw new Error("invalid password", {cause:400})
    }

    const accessToken = generateToken({
        payload: {id: user._id, email:user.email},
       secret_key: "secret",
       options: {
        jwtid:uuidv4(),
        noTimestamps:true,
        expiresIn:"2h"
    }})
    successResponse({res, data:{accessToken}})
}

export const getProfile = async (req,res,next)=>{

    successResponse({res, data: { ...req.user._doc, phone:decrypt(req.user.phone)}})
}