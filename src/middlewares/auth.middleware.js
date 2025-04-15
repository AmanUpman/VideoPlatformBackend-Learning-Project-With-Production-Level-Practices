import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","") // Here in the Header we simply want token from "Bearer <token>" that is available in jwt so we removed Bearer

        if(!token){
            throw new ApiError(401, "Unauthorised Request")
        }

        // jwt.verify is used to get the decoded token after veification
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
    
})
