import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT)

router.route('/toggle-video-like/c/:videoId').post(toggleVideoLike)
router.route('/toggle-comment-like/c/:commentId').post(toggleCommentLike)
router.route('/toggle-tweet-like/:tweetId').post(toggleTweetLike)
router.route('/get-liked-videos').get(getLikedVideos)

export default router