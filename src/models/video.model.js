import mongoose from "mongoose";
import { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            required: true
        },
        Thumbnail: {
            type: String,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        Title: {
            type: String,
            required: true
        },
        Description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            // requires: true
        },
        views: {
            type: Number,
            // requires: true
        },
        isPublished:{
            type: Boolean,
            // default: true
        }

    },
    {timestamps: true}
)

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)