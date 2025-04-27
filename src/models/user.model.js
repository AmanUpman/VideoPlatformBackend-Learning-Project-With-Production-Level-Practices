import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { type } from "os";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      // Dropped the wrong unique index on 'fullName' field from the 'users' collection
      // because 'fullName' should not be unique — only 'email' and 'username' must be unique.
      // Also went to the mongoose site on our collection and dropped the old fullname schema cause it won't get automatically updated.
      // unique : true,
      trim: true,
    },
    avatar: {
      // type : String, //Cloudinary Url
      // required : true,
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    coverImage: {
      // type : String,
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypting the password
// The pre middleware is executed before a specified operation is performed on a document. In   this case, it is used before the save operation on the userSchema.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // This method checks if the password field has been modified. If the password has not been changed (i.e., the user is updating other fields but not the password), the middleware will skip the hashing process

  this.password = await bcrypt.hash(this.password, 10); //Here 10 in code related to password hashing with libraries like bcrypt, it usually refers to the number of salt rounds (also called the cost factor).
  next();
});

// Comparing the given password and the encrypted password using methord
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//Setting up the tokens
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this.id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
