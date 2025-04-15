import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = asyncHandler(async (userID) => {
  const user = await User.findById(userID);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  // Svaing the refresh token in the database
  await user.save({ validateBeforeSave: false }); //Remove the step to check for password change using Validity Before Save.

  return { accessToken, refreshToken };
});

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { username, email, fullName, password } = req.body;
  // console.log("Email :", email);

  // VALIDATION - not empty

  // if(fullName === ""){
  //     throw new ApiError(400 , "Full Name cannot be empty")
  // }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // CHECK IF USER ALREADY EXISTS
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  // console.log(existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Setting up local path for AVATAR and COVER IMAGE
  // console.log("Uploaded Files:", JSON.stringify(req.files, null, 2));
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // Checking if COVER IMAGE is available
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  // Check if AVATAR is available
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Uploading files on CLOUDINARY
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  // Creating the user in the DATABASE
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // Checking if user exist and also removing password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong with registering the user");
  }

  // Return response
  return res
    .status(201)
    .json(
      new ApiResponse(201, createdUser, "User has been registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and referesh token
  // send cookie

  const { username, email, password } = req.body;
  console.log("Email : ", email);

  if (!username && !email) {
    throw new ApiError(400, "Either username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Here instead of using User, we are using user that is the component of Mongoose that we exported but user is what we created here and are working with.
  const passwordCheck = await user.isPasswordCorrect(password);

  if (!passwordCheck) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  // Now we will add the data we got into the user and also remove the data that we don't want our user to share
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Now we will work with cookies
  const options = {
    httpOnly: true,
    secure: true,
  }; // This settings allow the cookies to be only edited by the server and not eveyone.

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User is logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //Now we would create a middleware just to get the user
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  // jwt.verify is used to get the decoded token after veification
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    // Now we will compare the refresh token that we are getting from the user with the refresh token that the user has in the database
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCuurentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const { fullName, email } = res.body;

  if (!fullName || !email) {
    throw new ApiError(401, "Both of the fields are required");
  }

  const user = await User.findByIdAndUpdate(
    user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true } // By using new we are going to get the user with the updated values
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar file is missing");
  }

  // FOR LATER : I want to delete the OLD IMAGE that is already here
  // My approch : Creating a method like deleteFileCloudinary and using it here

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(401, "Cover image file is missing");
  }

  // FOR LATER : I want to delete the OLD IMAGE that is already here
  // My approch : Creating a method like deleteFileCloudinary and using it here

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading Cover Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username not found");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields : {
        subscribersCount : {
          $size : "$subscribers"
        },
        channelSubscribedToCount : {
          $size : "$subscribedTo"
        },
        isSubscribed : {
          $cond: {
            if : {$in : [req.user?._id, "$subscribers.subscriber"]},
            then : true,
            else : false
          } , 
        }
      }
    },
    {
      $project : {
        fullName : 1,
        username : 1,
        subscribersCount : 1,
        channelSubscribedToCount : 1,
        isSubscribed : 1,
        avatar : 1,
        coverImage : 1,
        email : 1
      }
    }
  ]);

  if(!channel?.length){
    throw new ApiError(404, "Channel does not exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User channel fetched successfully")
  )
});

const getWatchHistory =  asyncHandler(async (req, res) => {
  const user =  await User.aggregate([
    {
      $match : {
        _id :  new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup : {
        from : "videos",
        localField : "watchHistory",
        foreignField : "_id",
        as : "watchHistory",
        // We are goinf to use pipeline cause we wanted to create a nested loop from which we could get the owner field from the video model.
        pipeline : [
          {
            $lookup : {
              from : "users",
              localField : "owner",
              foreignField : "_id",
              as : "owner",
              // Here we don't want the whole user data again that why we could just filter out what we need
              pipeline : [
                {
                  $project : {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields : {
              owner : {
                $first : "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch history fetched successfully"
    )
  )
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCuurentPassword,
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
