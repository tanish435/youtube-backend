import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import { ApiError } from './ApiError';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        //file has been successfully uploaded
        // console.log("File is uploaded on cloudinary", response.url);

        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // Remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFileFromCloudinary = async (fileLink) => {
    try {
        // extracts public id from the url
        const extractPublicId = (url) => {
            const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.\/]+)/);
            return matches ? matches[1] : null;
        }

        const publicId = extractPublicId(fileLink)

        if(!publicId) {
            throw new ApiError('Failed to extract public ID from the file URI')
        }

        await cloudinary.uploader.destroy(publicId, (error) => {
            if(error) {
                throw new ApiError(error, "Failed to delete file from cloudinary")
            } else {
                console.log("File deleted from cloudinary")
            }
        })

    } catch (error) {
        throw new ApiError(error, "Failed to delete file from cloudinary");
    }
}

export { uploadOnCloudinary, deleteFileFromCloudinary }