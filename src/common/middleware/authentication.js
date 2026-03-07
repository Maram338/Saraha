import * as db_service  from "../../DB/db.service.js"
import { verifyToken } from "../../utils/token.service.js"
import userModel from "../../DB/models/user.model.js"
import { PREFIX } from "../../../config/config.service.js"

export const authentication = async (req,res,next) => {
    const {authorization} = req.headers
    if(!authorization){
        throw new Error ("token doesn't exist")
    }

    const [prefix, token] = authorization.split(" ")
    if(prefix !== PREFIX){
        throw new Error("invalid token prefix")
    }
    const decoded = verifyToken({token, secret_key: "secret"})

    if(!decoded || !decoded?.id){
        throw new Error("invalid token")
    }

    const user = await db_service.findById({
        model: userModel,
        id:decoded.id,
        select: "-password"
    })
    if(!user){
        throw new Error ("user not found")
    }
    req.user = user
    next()
}