import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    content:{
        type:String,
        required:true,
        minLength:1,
        maxLength:20000,
    },
    attachments:[{ 
        secure_url: {type: String},
        public_id: {type: String}
    }],
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    }
},{
    timestamps:true,
    strictQuery:true,
})


const messageModel = mongoose.models.message || mongoose.model("message", messageSchema)
export default messageModel