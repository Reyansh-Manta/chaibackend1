import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router()

router.route("/create").post(verifyJWT, createTweet)
router.route("/get-tweets").get(verifyJWT, getTweets)
router.route("/update-tweets/:tweetID").patch(verifyJWT, updateTweet)
router.route("/delete-tweets").delete(verifyJWT, deleteTweet)

export default router