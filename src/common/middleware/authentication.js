import * as db_service  from "../../DB/db.service.js"
import { verifyToken } from "../../utils/token.service.js"
import userModel from "../../DB/models/user.model.js"
import { PREFIX, SECRET_KEY } from "../../../config/config.service.js"
import revokeTokenModel from "../../DB/models/revokeToken.model.js"
import { get } from "../../DB/redis/redis.service.js"
import { revoked_key } from "../../DB/redis/redis.service.js"

export const authentication = async (req,res,next) => {
    const {authorization} = req.headers
    if(!authorization){
        throw new Error ("token doesn't exist")
    }

    const [prefix, token] = authorization.split(" ")
    if(prefix !== PREFIX){
        throw new Error("invalid token prefix")
    }
    const decoded = verifyToken({token, secret_key: SECRET_KEY})


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

    if(user?.changeCredential?.getTime() > decoded.iat * 1000){
        throw new Error ("token is invalid")
    }
    
    req.user = user
    req.decoded = decoded 

    const revoked = await get(revoked_key({userId: req.user._id, jti: req.decoded.jti}))
    
    if(revoked){
        throw new Error("this token is invalid")
    }

    next()
}