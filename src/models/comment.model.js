import mongoose , {Schema} from "mongoose"

const commentSchema = new Schema({
    video: {
        type: mongoose.Types.ObjectId,
        ref: "Video"
    },    
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    content: {
        type: String,
        required: true
    }    
},{timestamps: true})

export const Comment = mongoose.model("comment",commentSchema)