import { providerEnum } from "../../common/enum/user.enum.js"
import * as db_service from "../../DB/db.service.js"
import userModel from "../../DB/models/user.model.js"
import { successResponse } from "../../utils/respose.success.js"
import { decrypt, encrypt } from "../../utils/security/encrypt.security.js"
import { Compare, Hash } from "../../utils/security/hash.security.js"
import { v4 as uuidv4 } from "uuid"
import { generateToken } from "../../utils/token.service.js"
import {OAuth2Client} from 'google-auth-library'
import { PREFIX, REFRESH_SECRET_KEY, SALT_ROUNDS, SECRET_KEY } from "../../../config/config.service.js"
import cloudinary from "../../utils/cloudinary.js"
import revokeTokenModel from "../../DB/models/revokeToken.model.js"
import {randomUUID} from "node:crypto"
import { block_otp_key, deleteKey, get, get_key, incr, keys, max_otp_key, otp_key, setValue, ttl } from "../../DB/redis/redis.service.js"
import { revoked_key } from "../../DB/redis/redis.service.js"
import { generateOtp, sendEmail } from "../../utils/email/send.email.js"
import { compare } from "bcrypt"
import { eventEmitter } from "../../utils/email/email.events.js"
import { emailEnum } from "../../common/enum/email.enum.js"
import { emailTemp } from "../../utils/email/email.template.js"


const sendEmailOtp = async ({email, subject} = {}) => { 
    const isBlocked = await ttl(block_otp_key({email}))
    if(isBlocked > 0) {
        throw new Error (`you are blocked, try again after ${isBlocked} seconds `)
    }

    const otpTtl = await ttl(otp_key({email, subject}))
    if(otpTtl > 0){
        throw new Error(`you can resend otp after ${otpTtl} seconds`)
    }

    const maxOtp = await get(max_otp_key({email}))
    if(maxOtp > 100){
        await setValue({key: block_otp_key({email}), value: 1, ttl: 60})
        throw new Error("you've exceeded the maximum number of tries, try again later")
    }
    
    const otp = await generateOtp()        
    eventEmitter.emit(emailEnum.confirmEmail, async()=>{
        await sendEmail({
        to:email,
        subject,
        html: emailTemp(otp)
    })
    await setValue({key:otp_key({email, subject}), value: Hash({plainText:`${otp}`}), ttl: 60*5})
    await incr(max_otp_key({email}))
    })
}

export const signUp = async (req, res, next) => {
    const {userName, email, password, gender,phone} = req.body

    if( await db_service.findOne({
        model:userModel,
        filter: {email}
    }) 
    ){
        throw new Error("email already exists")  
    }

    let profilePicture = {}
if (req.file) {
    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'saraha/users' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(req.file.buffer);
    });

    profilePicture = {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id
    };
}
    
    const user = await db_service.create({model: userModel,
         data:{
            userName,
            email,
            password: Hash({plainText: password, salt_rounds:SALT_ROUNDS}),
            profilePicture,
            gender,
            phone:encrypt(phone)
            } 
        })

        sendEmailOtp({email: user.email, subject: emailEnum.confirmEmail})
     successResponse({res,status:201, data: user})
}

export const confirmEmail = async(req,res,next) => {
    const {email, code} = req.body
    const otpValue = await get( otp_key({ email }))
    if(!otpValue){
        throw new Error("otp expired")
    }
    if(!Compare({plainText: code, cipherText: otpValue})){
        throw new Error("invalid otp")
    }
    const user = await db_service.findOneAndUpdate({
        model: userModel,  
        filter: {email, confirmed: false, provider: providerEnum.system},
        update: {confirmed: true}
    })
    if(!user){
        throw new Error("user is not found")
    }
    await deleteKey( otp_key({ email }) )
    return successResponse({res, message:"email confirmed successfully"})
}

export const resendOtp = async (req,res,next) => {
    const { email } = req.body
    const user = await db_service.findOne({
        model: userModel,
        filter: {email, confirmed:false, provider: providerEnum.system}
    })

    if(!user){
        throw new Error ("user exists or already confirmed")
    }

    await sendEmailOtp({email, subject: emailEnum.confirmEmail})
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

    successResponse({res,status:201, data: {accessToken}})
}

export const signIn = async (req,res,next)=>{

    const {email, password} = req.body;

    const user = await db_service.findOne({
        model: userModel,
        filter: {email, provider:providerEnum.system, confirmed: {$exists: true}}
    })
    if(!user){
        throw new Error("user doesn't exist")
    }
    const match = Compare({plainText: password, cipherText: user.password})
    if(!match){
        throw new Error("invalid password", {cause:400})
    }

    const jwtid = randomUUID()
    const accessToken = generateToken({
        payload: {id: user._id, email:user.email},
       secret_key: SECRET_KEY,
       options: {
        jwtid,
        expiresIn:"20h"
    }})
    const refreshToken = generateToken({
        payload: {id: user._id, email:user.email},
       secret_key: REFRESH_SECRET_KEY,
       options: {
        jwtid,
        noTimestamp:true,
        expiresIn:"1y"
    }})

    successResponse({res, data:{accessToken, refreshToken}})
}

export const getProfile = async (req,res,next)=>{
    const key = `profile::${req.user._id}`
    const userExist = await get(key)
    if(userExist){
        return successResponse({res, data: userExist})
    }
    await setValue({key, value:req.user, ttl:60})
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

    const revoked = await db_service.findOne({
            model:revokeTokenModel,
            filter:{ tokenId:decoded.jti }
        })
        if(revoked){
            throw new Error("this token is invalid")
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
    let {firstName, lastName, gender, phone} = req.body
    if(phone){
        phone = encrypt(phone)
    }
    const user = await db_service.findOneAndUpdate({
        model:userModel,
        filter: {_id:req.user._id},
        update: {firstName, lastName, gender, phone},
        options: {new: true }
    })
    
    if(!user){
        throw new Error("user doesn't exist")
    }
    await deleteKey(`profile::${req.user._id}`)

    successResponse({res, data: user})
}

export const updatePassword = async (req,res,next) => {
    const {oldPassword, newPassword, cPassword} = req.body
    if(!compare({plainText:oldPassword, cipherText: req.user.password})){
        throw new Error ("wrong password")
    }
    const hash = Hash({plainText: newPassword})
    req.user.password = hash
    req.user.changeCredential = new Date()
    await req.user.save()
    successResponse({res})
}

export const logOut = async (req,res,next) => {
    const {flag} = req.query
    if(flag == "all"){
        req.user.changeCredential = new Date()
        await req.user.save()
        await deleteKey( await keys(get_key({userId: req.user._id})))
    }else{
        await setValue({
            key:revoked_key({userId: req.user._id, jti: req.decoded.jti}),
            value:`${req.decoded.jti}`,
            ttl:req.decoded.exp - Math.floor( Date.now() / 1000 )
        })
    }
    successResponse({res})
}

export const forgetPassword = async (req,res,next)=>{
    const {email} = req.body;

    const user = await db_service.findOne({
        model: userModel,
        filter: {email, provider:providerEnum.system, confirmed: {$exists: true}}
    })
    if(!user){
        throw new Error("user doesn't exist")
    }
    await sendEmailOtp({email, subject: emailEnum.forgetPassword})
    successResponse({res})
}

export const resetPassword = async (req,res,next)=>{
    const {email, code, password} = req.body;
    const otpValue = await get(otp_key({email, subject: emailEnum.forgetPassword}))
    if(!otpValue){
        throw new Error("otp has expired")
    }

    if(!Compare({plainText: code, cipherText: otpValue})){
        throw new Error ("invalid otp")
    }
    const user = await db_service.findOneAndUpdate({
        model: userModel,
        filter: {email, provider:providerEnum.system, confirmed: true},
        update: {
            password: Hash ({plainText: password}),
            changeCredential: new Date()
        }
    })
    if(!user){
        throw new Error("user doesn't exist")
    }

    await deleteKey(otp_key({email, subject: emailEnum.forgetPassword}))
    successResponse({res})
}