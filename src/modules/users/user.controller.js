import { Router } from "express";
import * as US from "./user.service.js"
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/enum/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import * as UV from "./user.validation.js";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { multerEnum } from "../../common/enum/multer.enum.js";
const userRouter = Router()

userRouter.post("/signUp",
    multer_host( multerEnum.image ).single("attachment"),
    validation(UV.signUpSchema),
    US.signUp)
userRouter.post("/signUp/gmail", US.signUpWithGmail)
userRouter.post("/signIn",validation(UV.signInSchema) ,US.signIn)
userRouter.get("/refresh-token",US.refreshToken)
userRouter.get("/profile",authentication,authorization([roleEnum.admin]),US.getProfile)
userRouter.get("/profile/:userId", US.profileViews)
userRouter.get("/share-profile/:id", US.shareProfile)
userRouter.patch("/update-profile",validation(UV.updateProfileSchema),authentication,US.updateProfile)
userRouter.patch("/update-password",authentication,validation(UV.updatePasswordSchema),US.updatePassword)
userRouter.get("/refreshToken", US.refreshToken)

export default userRouter