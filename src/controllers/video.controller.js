import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  
  // Get video details from front end
  // Differnciate videos based on query if given 
  // sort by if given
  // pagination

//   let allVideos;
//   if (title) {
//      allVideos = await Video.find({
//       title: {
//         $regex: title,
//         $options: "i",
//       }
//     });
//   } else if(owner){
//      allVideos = await Video.find({
//         owner: {
//           $regex: owner,
//           $options: "i",
//         }
//       });
//   } else {
//      allVideos = await Video.find();
//   }

    let filter = {}

    if(title){
        filter.title = {
          $regex: title,  // regex is used to get the element with the same name
          $options: 'i'   // 'i' makes the regex search case-insensitive
          }
    }
    if(owner){
        filter.owner = {
            $regex : owner, 
            $options : 'i'}
    }

    const allVideos  = await Video.find(filter);
});

const publishAVideo = asyncHandler(async (req, res) => {
  // Check if the title is not empty
  // Fetch the videoFile and thumbnail localpath
  // Check if thumbnail and videoFile present or not
  // Upload to cloudinary
  // create the video entry in db
  // check for video creation 
  // return res

  const { title, description } = req.body;

  if(!title || title.trim()=== " "){
    throw new ApiError(400,"Video title cannot be empty")
  }

  // console.log("Uploaded Files :" , JSON.stringify(req.files, null, 2)); 
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if(!videoFileLocalPath){
    throw new ApiError(400,"Video is missing!!")
  }

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if(!thumbnailLocalPath){
    throw new ApiError(400,"Thumbnail is missing!!")
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if(!videoFile){
    throw new ApiError(400, "Failed to upload videoFile to Cloudinary")
  }

  console.log("videoFile :", videoFile);
  console.log("videoFile Durartion :", videoFile.duration);

  if(!thumbnail){
    throw new ApiError(400, "Failed to upload thumbnail to Cloudinary")
  }

  const video = await Video.create({
    title,
    description,
    videoFile : {
      url : videoFile.url,
      public_id : videoFile.public_id,
    },
    thumbnail : {
      url : thumbnail.url,
      public_id : thumbnail.public_id,
    },
    duration : videoFile.duration,
  })

  if(!video){
    throw new ApiError(500, "Something went wrong with registering the video.")
  }

  return res
  .status(201)
  .json(
    new ApiResponse(201, video, "Video has been registered successfully")
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
