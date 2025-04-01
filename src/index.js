import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env",
});
 
//We are connecting mongodb database using index.js file in the db folder instead of doing it here like explained below 

connectDB()
.then(() => {
    app.on("error" , (error) => {
        console.log("Error : ", error);
    })
    app.listen(process.env.PORT || 8000, ()=> {
        console.log(`Server is listening on the port ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDB connection failed in index.js : ", err);
})


// Second methord to connect to database
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