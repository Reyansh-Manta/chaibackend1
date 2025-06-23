import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweets.model.js"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const createTweet = asyncHandler(async (req, res) => {

    const user = req.user

    if (!user) {
        throw new ApiError(401, "user not found")
    }
    const { content } = req.body

    if (!(content.length > 0)) {
        throw new ApiError(401, "tweet content is missing")
    }

    const currentUser = await req.user

    const tweet = await Tweet.create({
        content: content,
        owner: currentUser._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet created"))
})

const getTweets = asyncHandler(async(req,res) => {

    const tweeted = await Tweet.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "creater",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            email: 1,
                            createdAt: 1,
                            updatedAt: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                content: 1,
                creater: 1
            }
        }
    ])

    if (!tweeted?.length) {
        throw new ApiError(504, "tweet does not exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweeted, "tweets fetched"))
})

const updateTweet = asyncHandler(async (req, res) => {

    const {newTweet} = req.body
    const {tweetID} = req.params

    if(!newTweet || !tweetID){
        throw new ApiError(401, "info not provided")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetID,
        {
            $set:{
                content: newTweet
            }
        },
        {new:true}
    )

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet updated"))

})

const deleteTweet = asyncHandler(async (req, res) => {

    const {tweetID} = req.body

    if(!tweetID){
        throw new ApiError(401, "info not provided")
    }

    const tweet = await Tweet.findByIdAndDelete(
        tweetID
    )

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "tweet deleated"))

})

export { 
    createTweet,
    getTweets,
    updateTweet,
    deleteTweet
 }

// [user, content]