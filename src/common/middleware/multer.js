import multer from "multer";
import fs from "node:fs"

export const multer_local = ({customPath = "general", customType = []} = {}) => {

    const fullPath = `uploads/${customPath}`
    if(!fs.existsSync(fullPath)){
        fs.mkdirSync(fullPath, {recursive:true})
    }
    const storage = multer.diskStorage({
        destination: (req,file,cb) => {
            cb(null, fullPath)
        },
        filename: (req,file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null,uniqueSuffix + "_" + file.originalname)
        }
    })

    function fileFilter (req, file, cb) {
        if(!customType.includes(file.mimetype)){
            cb(new Error ("invalid file type"))
        }
        cb(null, true)
}
    const upload = multer({storage, fileFilter})
    return upload
}


export const multer_host = (customType = []) => {

    const storage = multer.diskStorage({})

    function fileFilter (req, file, cb) {
        if(!customType.includes(file.mimetype)){
            cb(new Error ("invalid file type"))
        }
        cb(null, true)
}
    const upload = multer({storage, fileFilter})
    return upload
}