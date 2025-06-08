import connectDB from "./db/index.js"
import { app } from "./app.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import {lim} from "./constants.js"
import express from "express"

connectDB()
.then(()=>{
    app.use(cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }))
    app.use(express.json({limit: lim}))
    app.use(express.urlencoded({extended:true, limit: lim}))
    app.use(express.static("public"))
    app.use(cookieParser())
    

    app.on("error",(err)=>{console.log("App connection error ", err)
        throw err;
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Error in connecting to app",err);
})