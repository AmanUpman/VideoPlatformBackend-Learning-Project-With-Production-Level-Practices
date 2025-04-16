import mongoose, {Schema} from "mongoose";
//The mongoose-aggregate-paginate-v2 library is used to facilitate pagination when working with MongoDB aggregate queries in a Mongoose application. Pagination is essential for managing large datasets by breaking them into smaller, more manageable chunks (pages).
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile : {
        type : String,
        required : true
    },
    thumbnail : {
        type : String,
        required : true
    },
    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    duration : {
        type : Number,
        required : true
    },
    views : {
        type : Number,
        default : 0
    },
    isPublished : {
        type : Boolean,
        default : true
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }


}, {timestamps : true})


//videoSchema.plugin(mongooseAggregatePaginate) is used to add pagination capabilities to a schema for video documents
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema);