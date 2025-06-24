import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// const testvideos = asyncHandler(async(req, res) => {

//     // made for the purpose of testing only 

//     const user = req.user
//     const video = await Video.create({
//         videoFile: `reyansh${user._id}`,
//         Thumbnail: `eyansh${user._id}`,
//         owner: user._id,
//         Title: `reansh ${user._id}`,
//         Description: `reansh ${user._id}`
//     })
//     return res
//         .status(200)
//         .json(new ApiResponse(200, video, "Video generated successfully"))

// })

const getAllVideos = asyncHandler(async(req, res) => {

const {page, limit, sortBy, query, sortType, userId} = req.query

if([page, limit, sortBy, query, sortType, userId].some((r)=> r?.trim === "")){
    throw new ApiError(401,"some or all query fields not found in the input")
}

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const sortOrder = sortType === "desc" ? -1 : 1
    const sort = {[sortBy]: sortOrder}

    const posts = await Video
                        .find(
                            {
                            owner : userId,
                            Title : {$regex : `${query}`, $options: "i"},
                            Description : {$regex : `${query}`, $options: "i"},
                            }
                        )
                        .sort(sort)
                        .limit(limitNum)
                        .skip((pageNum-1)*10)

    return res  
        .status(200)
        .json(new ApiResponse(200, [posts, posts.length], "Videos fetched successfully"))

})

export {
    // testvideos,
    getAllVideos
}