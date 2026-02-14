import { Router } from "express";
import * as US from "./user.service.js"
import { authentication } from "../../common/middleware/authentication.js";
const userRouter = Router()

userRouter.post("/signUp", US.signUp)
userRouter.post("/signIn", US.signIn)
userRouter.get("/profile",authentication,US.getProfile)

export default userRouter