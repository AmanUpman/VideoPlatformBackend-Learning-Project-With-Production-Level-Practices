import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = asyncHandler(async (userID) => {
  const user = await User.findById(userID);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  // Svaing the refresh token in the database
  user.save({ ValidateBeforeSave: false }); //Remove the step to check for password change using Validity Before Save.

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
  console.log(existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Setting up local path for AVATAR and COVER IMAGE
  console.log("Uploaded Files:", JSON.stringify(req.files, null, 2));
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
  if (!username && !email) {
    throw new ApiError(400, "Either username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Here instead of using User, we are using user is the the component of Mongoose that we exported but user is what we created here and are working with.
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

export { registerUser, loginUser, logoutUser };
