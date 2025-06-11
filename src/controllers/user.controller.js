// user.controller.js start

import { asyncHandler } from "../utils/asyncHandler.js"

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

})

export { registerUser }

// user.controller.js end
