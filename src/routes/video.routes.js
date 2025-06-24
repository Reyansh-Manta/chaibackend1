import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos } from "../controllers/videos.controller.js";

const router = Router()

// router.route("/test").post(verifyJWT, testvideos)
router.route("/get-videos").post(verifyJWT, getAllVideos)

export default router