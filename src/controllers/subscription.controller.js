import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(401, "channelId not valid")
    }

    const user = req.user
    
    const subs = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriptionData"
            }
        },
        {
            $project:{
                subscriptionData: 1
            }
        }
    ])

    for (let index = 0; index < subs.length; index++) {
        const element = await Subscription.findById(subs[index]._id);
        if(element?.subscriber?.equals(user._id)){
            var exists = true
            var i = index
            break
        }
}
        
    if(exists){
        await Subscription.findByIdAndDelete(subs[i]._id)
    }
    else{
        await Subscription.create({
            subscriber: user._id,
            channel: channelId
        })
    }
    
    return res  
        .status(200)
        .json(new ApiResponse(200, {}, "Toggled successfully"))
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
    throw new ApiError(401, "channelId not valid")
    }

    const subs = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriptionData"
            }
        },
        {
            $project:{ 
                channel: 1
            }
        }       
    ])

    const subscount = [`subscriber-count = ${subs.length}`]

    return res  
        .status(200)
        .json(new ApiResponse(200, [{subs},{subscount}], "fetched the data"))

})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params

        if(!isValidObjectId(subscriberId)){
        throw new ApiError(401, "subscriberId not valid")
    }

    const subs = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedToData"
            }
        },
        {
            $project:{ 
                subscriber: 1,
                subscribedToData: 1
            }
        }       
    ])

    const subscount = [`subscribedToCount = ${subs.length}`]

    return res  
        .status(200)
        .json(new ApiResponse(200, [{subs},{subscount}], "fetched the data"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
