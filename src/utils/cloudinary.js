import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// We have to again import dotenv in here otherwise the image wont be uploaded and we will get error : "avatar no found" etc etc
dotenv.config({
  path: "./.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localPath) => {
  try {
    if (!localPath) return null;

    //Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });

    //File has been uploded sucessfully
    // console.log("File has been uploded sucessfully" , response.url);
    fs.unlinkSync(localPath);
    return response;
  } catch (error) {
    fs.unlinkSync(localPath); //Remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

// We use public_id (not the URL) because Cloudinary needs the unique identifier to locate and manage the file internally — URLs can't be used for deletion.
const deleteFileCloudinary = async (public_id) => {
  try {
    if (!public_id) return;

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image", // Here when we delete something from cloudinary, we have to specify the type, we can't just use auto like the upload.
    });
    if (result.result === "ok") {
      console.log("File deleted successfully");
    } else {
      console.log("File deletion failed or file not found:", result);
    }
  } catch (error) {
    console.log("NOt able to perform delete in cloudinary.js", error);
  }
};

export { uploadOnCloudinary, deleteFileCloudinary };
