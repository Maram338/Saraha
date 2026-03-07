import joi from "joi"
import { genderEnum } from "../../common/enum/user.enum.js"
import { generalRules } from "../../utils/security/generalRules.js"

export const signUpSchema = {
    body: joi.object({
    userName:joi.string().min(10).max(40).required(),
    email: generalRules.email.required(),
    password: generalRules.password.required(),
    cPassword: generalRules.cpassword.required(),
    gender: joi.string().valid(...Object.values(genderEnum)).required(),
    phone:joi.string().required()
}).required().messages({
    "any.required": "body should not be empty" 
}),
//file: generalRules.file.required()
//files:joi.array().max(2).items(generalRules.file.required()).required
files:joi.object({
    attachment: joi.array().max(1).items(generalRules.file.required()).required(),
    attachments:joi.array().max(3).items(generalRules.file.required()).required()
  }).required()
}

export const signInSchema = {
        body:joi.object({
        email:generalRules.email.required(),
        password:generalRules.password.required()
    }).required()
}

export const shareProfileSchema = {
        params: joi.object({
        id: generalRules.id.required()
    }).required()
}

export const updateProfileSchema = {
        body: joi.object({
            firstName:joi.string().min(10).max(40),
            lastName:joi.string().min(10).max(40),
            gender: joi.string().valid(...Object.values(genderEnum)),
            phone:joi.string()
    }).required()
}

export const updatePasswordSchema = {
    body: joi.object({
        newPassword: generalRules.password.required(),
        cPassword: joi.string().valid(joi.ref("newPassword")),
        oldPassword: generalRules.password.required(),
    })
}