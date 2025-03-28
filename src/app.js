import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true , limit: "16kb"})) //We are using externded and all to even be able to handle nested objects
app.use(express.static("public"))
app.use(cookieParser())

export {app};