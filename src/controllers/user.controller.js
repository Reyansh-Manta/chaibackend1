// user.controller.js start

import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

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

    const {username, fullName, email, password} = req.body

    if(
        [username, fullName, email, password].some((f)=> f?.trim === "")
    ){
        throw new ApiError(400, "Empty fields", )
    }
     
    const existedUser = User.findOne({$or: [{ email }, { username }]})
    if(existedUser){
        throw new ApiError(409, "User with this username or email already existed")
    }
    
    const avatarLocalPath = req.files?.avatar[0].path
    const coverLocalPath = req.files?.coverImage[0].path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if(!avatar){
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

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})



export { registerUser }

// user.controller.js end
