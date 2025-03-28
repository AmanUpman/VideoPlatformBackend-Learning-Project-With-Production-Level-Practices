import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true, 
            index : true
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true, 
        }, 
        fullName : {
            type : String,
            required : true,
            unique : true,
            trim : true, 
        },       
        avatar : {
            type : String, //Cloudinary Url
            required : true,
        },
        coverImage : {
            type : String,
        },
        watchHistory : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required : [true , "Passwoed is required"]
        },
        refreshToken : {
            type : String,
        }
    } , 
    {
        timestamps : true 
    }
);

//Encrypting the password
userSchema.pre("save", async function(next){
    if(!this.isModified("password"))  return next();

    this.password = bcrypt.hash(this.password, 10)
    next()
})

//Comparing the given password and the rncrypted password using methord
userSchema.methods.isPasswordCorrecr = async function(password){
    return await bcrypt.compare(password , this.password)
}

//Setting up the tokens 
userSchema.methords.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this.id,
            email : this.email,
            username : this.username,
            fullName : this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methords.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);
