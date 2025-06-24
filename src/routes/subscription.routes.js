import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()

router.route("/toggle-subscription/:channelId").post(verifyJWT, toggleSubscription)
router.route("/channelSubscribers/:channelId").post(verifyJWT, getUserChannelSubscribers)
router.route("/channelsSubscribedTo/:subscriberId").post(verifyJWT, getSubscribedChannels)

export default router