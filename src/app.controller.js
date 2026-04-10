import express from "express";
import checkConnectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import cors from "cors"
import { PORT, WHITE_LIST } from "../config/config.service.js";
import { redisConnection } from "./DB/redis/redis.db.js";
import messageRouter from "./modules/messages/message.controller.js";
import { rateLimit } from 'express-rate-limit'
import helmet from "helmet"
const port = PORT

export const bootstrap = async (app)=>{

    app.set("trust proxy", 1)
    const limiter = rateLimit({
        windowMs: 60 * 30 * 100,
        limit: 100,
        statusCode:400,
        handler: (req,res,next) => {
            return res.status(401).json({message: "Game over"})
        }
    })

    const corsOptions = {
    origin: function (origin, callback) {
    if([...WHITE_LIST, undefined].includes(origin)){
        callback(null, true)
    }else{
        callback(new Error("not allowed by cors"))
    }
  }
}
    app.use(
        cors(corsOptions),
        helmet(),
        limiter,
        express.json()
    )

    app.get("/",(req,res,next)=>{res,send("welcome on saraha")})

    checkConnectionDB()
    redisConnection()

    app.use("/uploads", express.static("uploads"))

    app.use("/users", userRouter)
    app.use("/messages", messageRouter)
    

    app.get("{/*demo}",(req,res,next)=>{
        throw new Error(`url ${req.originalUrl} not found`,{cause:404})
    })

    app.use((err,req,res,next)=>{

        res.status(err.cause || 500).json({message: err.message, stack: err.stack})
    })

if(process.env.NODE_ENV !== "production"){
    app.listen(port, () => console.log(`server is running on port ${port}`))
}
}

export default bootstrap