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
            $regex : title, 
            $options : 'i'}
    }
    if(owner){
        filter.owner = {
            $regex : owner, 
            $options : 'i'}
    }

    const allVideos  = await Video.find(filter);
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
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
