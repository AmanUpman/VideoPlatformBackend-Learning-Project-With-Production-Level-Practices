import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content : {
            typeof : String,
            required : true
        },
        video : {
            typeof : Schema.Types.ObjectId,
            ref : "Video"
        },
        owner : {
            typeof : Schema.Types.ObjectId,
            ref : "User"
        }
    }, {timestamps : true})

commentSchema.plugin(mongooseAggregatePaginate)
export const comment = mongoose.model("Comment", commentSchema)