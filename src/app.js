//app.js start

import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { lim } from "./constants.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: lim }))
app.use(express.urlencoded({ extended: true, limit: lim }))
app.use(express.static("public"))
app.use(cookieParser())

//import routes
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"

//routes declaration
//cant use app.get because router are in a different file

app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)

export { app }

//app.js