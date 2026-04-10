import { EventEmitter } from "node:events";
import { emailEnum } from "../../common/enum/email.enum.js";

export const eventEmitter = new EventEmitter()
eventEmitter.on(emailEnum.confirmEmail, async(fn)=>{
    await fn()
})

eventEmitter.on(emailEnum.forgetPassword, async(fn)=>{
    await fn()
})