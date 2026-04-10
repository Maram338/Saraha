import joi from "joi"
import { genderEnum } from "../../common/enum/user.enum.js"
import { generalRules } from "../../utils/security/generalRules.js"

export const signUpSchema = {
    body: joi.object({
    userName:joi.string().min(3).max(40).required(),
    email: generalRules.email.required(),
    password: generalRules.password.required(),
    cPassword: generalRules.cpassword.required(),
    gender: joi.string().valid(...Object.values(genderEnum)).required(),
    phone:joi.string().required()
}).required().messages({
    "any.required": "body should not be empty" 
}),

file: generalRules.file.optional().unknown(true)
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
        cPassword: joi.string().valid(joi.ref("newPassword")).required(),
        oldPassword: generalRules.password.required(),
    }).required()
}

export const confirmEmailSchema = {
    body: joi.object({
        email: generalRules.email.required(),
        code: joi.string().regex(/^\d{6}$/).required()
    }).required()
}

export const resendOtpSchema = {
    body: joi.object({
        email: generalRules.email.required()
    }).required()
}

export const resetPasswordSchema = {
    body: signInSchema.body.append({
        code: joi.string().regex(/^\d{6}$/).required(),
        cpassword: generalRules.cpassword.required()
    }).required()
}