// user.controller.js start

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = User.findById(userId)
        const accessToken = user.generateAccessTokens()
        const refreshToken = user.generateRefreshTokens()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
        
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

    const avatarLocalPath = req.files?.avatar[0].path
    // const coverLocalPath = req.files?.coverImage[0].path
    let coverLocalPath

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
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
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})

const loginUser = asyncHandler(async(req,res)=>{

    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body

    if(!email && !username){
        throw new ApiError(404, "username or email required")
    }

    const user = User.findOne({
        $or: [{email},{username}]
    })

    if(!user){
        throw new ApiError(408, "user does not exist")
    }

    if(!password){
        throw new ApiError(404, "password required")
    }

    const isPasswordValid = user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404, "incorrect user credentials")
    }

    const {accessToken, refreshToken} = generateAccessAndRefreshTokens(user._id)

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

const logoutUser = asyncHandler(async(req,res)=>{
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
        200,{},"User logged out"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser
 }

// user.controller.js end
