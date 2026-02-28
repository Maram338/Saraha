import mongoose from "mongoose";
import { genderEnum, providerEnum, roleEnum } from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:String,
        minLength:3,
        maxLength:8,
        trim:true
    },
    lastName:{
        type:String,
        required:String,
        minLength:3,
        maxLength:8,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:function (){
            return this.provider == providerEnum.google ? false : true
        },
        minLength:6,
        trim:true
    },
    phone:{
        type:String,
    },
    gender:{
        type:String,
        enum:Object.values(genderEnum),
        default: genderEnum.male
    },
    profilePicture: String,
    provider:{
        type:String,
        enum:Object.values(providerEnum),
        default:providerEnum.system
    },
    confirmed:Boolean,
    role:{
        type:String,
        required:true,
        enum:Object.values(roleEnum),
        default:roleEnum.user
    },
    views: {
        type:String,
        default:0
    }
},{
    timestamps:true,
    strictQuery:true,
    toJSON:{virtuals:true}
})

userSchema.virtual("userName")
.get(function(){
    return this.firstName + " " +this.lastName;
})
.set(function(v){
    const [firstName, lastName] = v.split(" ")
    this.set({firstName, lastName})
})

const userModel = mongoose.models.user || mongoose.model("user", userSchema)
export default userModel