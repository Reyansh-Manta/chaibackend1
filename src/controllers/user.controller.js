// user.controller.js start

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessTokens()
        const refreshToken = user.generateRefreshTokens()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Error generating Access and Refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    //get user details from frontend
    //validation-not empty
    //check if user already exists- username, email 
    //check for images- avatar
    //upload to cloudinary- avatar
    //create user object- create entry in db
    //remove password and refresh token from the response
    //check for user creation
    //return res

    const { username, fullName, email, password } = req.body

    if (
        [username, fullName, email, password].some((f) => f?.trim === "")
    ) {
        throw new ApiError(400, "Empty fields",)
    }

    const existedUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existedUser) {
        throw new ApiError(409, "User with this username or email already existed")
    }

    if (!req.files.avatar) {
        throw new ApiError(500, "req.files not available")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverLocalPath = req.files?.coverImage[0].path
    let coverLocalPath
    // let avatarLocalPath
    // if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0){
    //     avatarLocalPath = req.files?.avatar[0].path
    // }
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLocalPath = req.files?.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }


    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        fullName,
        password
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )


})

const loginUser = asyncHandler(async (req, res) => {

    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError(404, "username or email required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(408, "user does not exist")
    }

    if (!password) {
        throw new ApiError(404, "password required")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "incorrect user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(
            200, {}, "User logged out"
        ))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refrehToken")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("refreshToken", newrefreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user._id)

    const oldPasswordValidation = user.isPasswordCorrect(oldPassword)

    if (!oldPasswordValidation) {
        throw new ApiError(400, "Password incorrect")
    }

    user.password = newPassword
    await user.save("ValidateBeforeSave: false")

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password updated"))

})

const getCurrentUser = asyncHandler(async (req, res) => {

    const user = req.user

    return res
        .status(200)
        .json(new ApiResponse(200, user, "fetched the current user"))
})

const updateFullName = asyncHandler(async (req, res) => {
    const { fullName } = req.body

    if (!fullName) {
        throw new ApiError(401, "fullName is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "fullName was updated"))
})

const updateEmail = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        throw new ApiError(401, "email is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "email was updated"))
})

const updateAvatar = asyncHandler(async (req, res) => {
    
    const oldImageUSER = req.user

    if (!oldImageUSER) {
        throw new ApiError(501, "User not found")
    }

    const curl = oldImageUSER.avatar

    if (!curl) {
        throw new ApiError(501, "avatar not found")
    }
    await deleteFromCloudinary(curl)

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(401, "file local path not found")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(401, "uploading file url not found on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar image updated"))

})

const updateCoverImage = asyncHandler(async (req, res) => {

    const oldImageUSER = req.user

    if (!oldImageUSER) {
        throw new ApiError(501, "User not found")
    }

    const curl = oldImageUSER.coverImage

    if (!curl) {
        throw new ApiError(501, "coverImage not found")
    }
    await deleteFromCloudinary(curl)

    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(401, "file local path not found")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(401, "file url not found on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "coverImage updated"))

})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(404, "couldn't fetch username from req.params")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "channelsSubscriberTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$channelsSubscriberTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, $subscribers.subscriber] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                email: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(504, "Channel does not exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))

})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = User.aggregate([
        {
            $match:
            {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [{
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [{
                            $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1
                            }
                        }]
                    }
                },
                {
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "User History fetched successfully"))

})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateFullName,
    updateEmail,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

// user.controller.js end
