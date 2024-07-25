import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
        // It is not recommended to keep the name as orignial name of the file but beacause it remains for very less amount of time in our server and it will be deleted once it has been uploaded to cloudinary
    }
})

export const upload = multer({ 
    storage: storage,
})