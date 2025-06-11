//index.js start

import connectDB from "./db/index.js"
import { app } from "./app.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import { asyncHandler } from "./utils/asyncHandler.js"

connectDB()
.then(()=>{

    app.on("error",(err)=>{console.log("App connection error ", err)
        throw err;
    })
    app.listen(process.env.PORT || 5000, ()=>{
        console.log(`Server running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Error in connecting to app",err);
})

//index.js end