import { Router } from "express";
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT)

router.route('/create-tweet').post(createTweet)
router.route('/update-tweet/c/:tweetId').patch(updateTweet)
router.route('/delete-tweet/c/:tweetId').post(deleteTweet)
router.route('/get-user-tweets').get(getUserTweets)

export default router;