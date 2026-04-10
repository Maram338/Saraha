import mongoose from "mongoose"
import { DB_URI_ONLINE } from "../../config/config.service.js";

const checkConnectionDB = async ()=>{
    await mongoose.connect(DB_URI_ONLINE, {serverSelectionTimeoutMS:5000})
    .then(()=>{
        console.log("DB connected successfully");
    })
    .catch(()=>{
        console.log("DB failed to connect");
    })
}

export default checkConnectionDB