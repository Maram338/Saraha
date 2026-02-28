import joi from "joi"
import { genderEnum } from "../../common/enum/user.enum.js"

export const signUpSchema = {
    body: joi.object({
    userName:joi.string().min(10).max(40).required(),
    email: joi.string().email({tlds:{allow:false, deny:["org"]}, minDomainSegments:2}).required(),
    password: joi.string().min(8).required(),
    cPassword: joi.string().valid(joi.ref("password")).required(),
    gender: joi.string().valid(...Object.values(genderEnum)).required()
}).required().messages({
    "any.required": "body should not be empty" 
})
}

export const signInSchema = {
    body:joi.object({
    email:joi.string().required(),
    password:joi.string().min(20)
}).required()
}