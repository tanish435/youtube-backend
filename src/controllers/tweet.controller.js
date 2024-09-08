import {Tweet} from '../models/tweet.model.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {ApiError} from '../utils/ApiError.js'
import mongoose from 'mongoose'

const createTweet = asyncHandler(async (req, res) => {
    const user = req.user?._id
    const {content} = req.body

    if(!content) {
        throw new ApiError(400, 'Tweet content is required')
    }

    if(!user) {
        throw new ApiError(400, 'User not found')
    }

    const tweet = await Tweet.create({
        owner: new mongoose.Types.ObjectId(user),
        content
    })

    if(!tweet) {
        throw new ApiError(500, 'Failed to tweet')
    }

    return res
    .status(201)
    .json(new ApiResponse(200, tweet, "Tweet created"))
})

const updateTweet = asyncHandler(async(req, res) => {
    const {content} = req.body
    const {tweetId} = req.params

    if(!tweetId) {
        throw new ApiError(400, 'Tweet not found')
    }

    if(!content) {
        throw new ApiError(400, 'Add new tweet content')
    }

    const newTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId
        }, 
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!newTweet) {
        throw new ApiError(500, 'Failed to update tweet')
    }

    return res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!tweetId) {
        throw new ApiError(400, 'Tweet ID not found')
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet) {
        throw new ApiError(500, 'Failed to delete tweet')
    }

    return res
    .status(200)
    .json(new ApiResponse(201, deletedTweet, "Tweet deleted"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const {page = 1, limit = 10} = req.query
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    
    const userTweets = await Tweet.find({owner: userId})
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .sort({createdAt: -1})

    if(userTweets.length < 1) {
        return res
        .status(200)
        .json(new ApiResponse(200, [], "No tweets found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "User tweets fetched successfully"))
})

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets,
}