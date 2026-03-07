import { providerEnum } from "../../common/enum/user.enum.js"
import * as db_service from "../../DB/db.service.js"
import userModel from "../../DB/models/user.model.js"
import { successResponse } from "../../utils/respose.success.js"
import { decrypt, encrypt } from "../../utils/security/encrypt.security.js"
import { Copmpare, Hash } from "../../utils/security/hash.security.js"
import { v4 as uuidv4 } from "uuid"
import { generateToken } from "../../utils/token.service.js"
import {OAuth2Client} from 'google-auth-library'
import { PREFIX, REFRESH_SECRET_KEY, SALT_ROUNDS, SECRET_KEY } from "../../../config/config.service.js"
import cloudinary from "../../utils/cloudinary.js"


export const signUp = async (req, res, next) => {
    const {userName, email, password, gender,phone} = req.body

    if( await db_service.findOne({
        model:userModel,
        filter: {email}
    }) 
    ){
        throw new Error("email already exists")  
    }

    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path)
    
    /*let arr_paths = []
    for (const file of req.files.attachments) {
        arr_paths.push(file.path)
    }*/

    const user = await db_service.create({model: userModel,
         data:{
            userName,
            email,
            password: Hash({plainText: password, salt_rounds:SALT_ROUNDS}),
            //album: arr_paths,
            profilePicture:{secure_url, public_id}
            //gender,
            //phone:encrypt(phone)
            } 
        })
    successResponse({res,status:201, data: user})
}
export const signUpWithGmail = async (req, res, next) => {
    const {idToken} = req.body

    
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience:"744559879249-nicm3br4fm6fbmkti7vbbp2uc508nsi7.apps.googleusercontent.com",
  });
    const payload = ticket.getPayload();
    const {email, email_verified, name, picture} = payload

    let user = await db_service.findOne({model:userModel, filter:{ email }})
    if(!user){
        user = await db_service.create({
            model:userModel,
            data:{
                email,
                confirmed: email_verified,
                userName: name,
                profilePicture: picture,
                provider: providerEnum.google
            }
        })
    }
    if(user.provider == providerEnum.system){
        throw new Error ("log in using system", {cause:400})
    }
    const accessToken = generateToken({
        payload: {id: user._id, email:user.email},
       secret_key: SECRET_KEY,
       options: {
        jwtid:uuidv4(),
        expiresIn:"2h"
    }})

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
       secret_key: SECRET_KEY,
       options: {
        jwtid:uuidv4(),
        noTimestamps:true,
        expiresIn:"2h"
    }})
    const refreshToken = generateToken({
        payload: {id: user._id, email:user.email},
       secret_key: REFRESH_SECRET_KEY,
       options: {
        jwtid:uuidv4(),
        noTimestamps:true,
        expiresIn:"1y"
    }})

    successResponse({res, data:{accessToken, refreshToken}})
}

export const getProfile = async (req,res,next)=>{

    successResponse({res, data: { ...req.user._doc, phone:decrypt(req.user.phone)}})
}

export const profileViews = async (req,res,next) => {
    const { userId } = req.params
    const user = await db_service.findOneAndUpdate({
        model: userModel,
        filter: {_id: userId},
        data: {$inc:{views:1}},
        options: {new: true}
    })
    if(!user){
        throw new Error("user not found", {cause:404})
    }
    successResponse ({res,data:user})
}

export const refreshToken = async (req,res,next) =>{
    const {authorization} = req.headers
    if(!authorization){
        throw new Error("token not found")
    }
    const [prefix, token] = authorization.split(" ")
    if(prefix != PREFIX) {
        throw new Error("invalid token")
    }
    const decoded = verifyToken({token, secret_key: REFRESH_SECRET_KEY})
    if(!decoded || !decoded?.id){
        throw new Error("invalid token")
    }
    const user = await db_service.findOne({
        model:userModel, filter:{_id:decoded.id}
    })
    if(!user){
        throw new Error("user doesn't exist")
    }
    const accessToken = generateToken({
        payload:{
            id:user._id, email:user.email
        },
        secret_key:ACCESS_SECRET_KEY,
        options:{
            expiresIn:60*5
        }
    })
    successResponse({res, data:accessToken})
}

export const shareProfile = async (req,res,next) => {
    const {id} = req.params
    const user = await db_service.findById({
        model:userModel,
        id,
        select: "-password"
    })
    if(!user){
        throw new Error("user doesn't exist")
    }
    user.phone = decrypt(user.phone)
    successResponse({res, data: user})
}

export const updateProfile = async (req,res,next) => {
    const {firstName, lastName, gender, phone} = req.body
    if(phone){
        phone = encrypt(phone)
    }
    const user = await db_service.findOneAndUpdate({
        model:userModel,
        filter: {_id:req.user._id},
        update: {firstName, lastName, gender, phone}
    })
    
    if(!user){
        throw new Error("user doesn't exist")
    }

    successResponse({res, data: user})
}
export const updatePassword = async (req,res,next) => {
    const {oldPassword, newPassword, cPassword} = req.body
    if(!Copmpare({plainText:oldPassword, cipherText: req.user.password})){
        throw new Error ("wrong password")
    }
    const hash = Hash({plainText: newPassword})
    req.user.password = hash
    await req.user.save()
    successResponse({res})
}