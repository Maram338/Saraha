import { emailEnum } from "../../common/enum/email.enum.js";
import { redisClient } from "./redis.db.js";

export const revoked_key = (userId, jti) => {
    return `revoke_token::${userId}::${jti}`
}

export const get_key = ({userId}) => {
    return `revoke_token::${userId}`
}

export const otp_key = ({email, subject = emailEnum.confirmEmail}) => {
    return `otp::${email}::${subject}`
}

export const max_otp_key = ({email}) => {
    return `${otp_key({email})}::max-tries`
}
export const block_otp_key = ({email}) => {
    return `${otp_key({email})}::block`
}

export const setValue = async ({key, value, ttl} = {}) => {
    try {
        const data = typeof value === "string" ? value : JSON.stringify(value)
        return ttl ? await redisClient.set(key, data, {EX:ttl}) : await redisClient.set(key, data)
    } catch (error) {
        console.log("error to set data into redis", error);
    }
}

export const update = async ({key, value} = {}) => {
    try {
        if(!await redisClient.exists(key)) return 0
        return await setValue({key, value, ttl})
    } catch (error) {
        console.log("error in updating data in redis", error)   
    }
}

export const get = async (key) => {
    try {
        try {
            return JSON.parse(await redisClient.get(key))
        } catch (error) {
            return await redisClient.get(key)
        }
    } catch (error) {
        console.log("error in getting data from redis", error);
    }
}

export const exists = async (key) => {
    try {
        return await redisClient.exists(key)
    } catch (error) {
        console.log("error in checking if data exists in redis", error)
    }
}

export const ttl = async (key) => {
    try {
        return await redisClient.ttl(key)
    } catch (error) {
        console.log("error to get ttl from redis", error);
    }
}  

// to get all keys
export const keys = async (pattern) => {
    try {
        return await redisClient.keys(`${pattern}*`)
    } catch (error) {
        console.log("failed to get keys from redis", error)
    }
}
export const incr = async (key) => {
    try {
        return await redisClient.incr(key)
    } catch (error) {
        console.log("failed to increment keys from redis", error)
    }
}

export const deleteKey = async (key) => {
    try {
        if(!key.length) return 0
        return await redisClient.del(key)
    } catch (error) {
        console.log("error in deleting data from redis", error)
    }
}

export const expires = async ({ key,ttl }) => {
    try {
        return await redisClient.expire(key, ttl)
    } catch (error) {
        console.log("failed to set expiration in redis", error)
    }
}

