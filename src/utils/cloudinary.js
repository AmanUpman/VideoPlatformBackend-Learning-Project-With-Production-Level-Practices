import dotenv from "dotenv"
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// We have to again import dotenv in here otherwise the image wont be uploaded and we will get error : "avatar no found" etc etc
dotenv.config({
    path : "./.env",
});

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localPath) => {
    try{
        if(!localPath) return null;
        
        //Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localPath, {
            resource_type : "auto"
        })

        //File has been uploded sucessfully
        // console.log("File has been uploded sucessfully" , response.url);
        fs.unlinkSync(localPath)
        return response;

    } catch (error){
        fs.unlinkSync(localPath) //Remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}