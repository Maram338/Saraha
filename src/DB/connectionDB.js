import mongoose from "mongoose"

const checkConnectionDB = async ()=>{
    await mongoose.connect("mongodb://127.0.0.1:27017/saraha", {serverSelectionTimeoutMS:5000})
    .then(()=>{
        console.log("DB connected successfully");
    })
    .catch(()=>{
        console.log("DB failed to connect");
    })
}

export default checkConnectionDB