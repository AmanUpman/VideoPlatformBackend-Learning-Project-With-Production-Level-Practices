import dotenv from "dotenv";
import connectDB from "./db/index.js";

import express from "express";
const app = express();

dotenv.config({
    path: "./.env",
});
 
connectDB()
















































// #Second methord to connect to database
// (async() => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on("error", (error) => {
//             console.log("Error", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`Server is listening on the port ${process.env.PORt}`)
//         })

//     } catch (error){
//         console.error("ERROR :" ,error)
//         throw err 
//     }
// })()