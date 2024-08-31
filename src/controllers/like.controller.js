import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {ApiError} from '../utils/ApiError.js'
import { Like } from '../models/like.model.js'
import mongoose, { isValidObjectId } from 'mongoose'

const toggleVideoLike = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }

    const like = await Like.findOne({video: videoId, likedBy: userId})

    if(like) {
        const likeRemoved = await Like.deleteOne({video: videoId, likedBy: userId})

        if(!likeRemoved) {
            throw new ApiError(500, 'Failed to remove video like')
        }

        return res.
        status(200).
        json(new ApiResponse(200, {}, "Video like removed successfully"))

    } else {
        const addLike = await Like.create({
            video: videoId,
            likedBy: userId,
        })

        if(!addLike) {
            throw new ApiError(500, 'Failed to like video')
        }

        return res.
        status(200).
        json(new ApiResponse(201, addLike, "Liked the video"))
    }
})

const toggleCommentLike = asyncHandler(async(req, res) => {
    const {commentId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment ID') 
    }

    const like = await Like.findOne({comment: commentId, likedBy: userId})

    if(like) {
        const likeRemoved = await Like.deleteOne({comment: commentId, likedBy: userId})

        if(!likeRemoved) {
            throw new ApiError(500, 'Failed to remove comment like')
        }

        return res.
        status(200).
        json(new ApiResponse(201, {}, 'Comment like removed successfully'))
    } else {
        const addLike = await Like.create({
            comment: commentId,
            likedBy: userId
        })

        if(!addLike) {
            throw new ApiError(500, 'Failed to like comment')
        }

        return res.
        status(200).
        json(new ApiResponse(201, addLike, 'Liked the comment'))
    }
})

const toggleTweetLike = asyncHandler(async(req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, 'Invalid tweet id')
    }

    const like = await Like.findOne({tweet: tweetId, likedBy: userId})

    if(like) {
        const likeRemoved = await Like.deleteOne({tweet: tweetId, likedBy: userId})

        if(!likeRemoved) {
            throw new ApiError(500, 'Failed to remove tweet like')
        }

        return res.
        status(200).
        json(new ApiResponse(200, {}, 'Tweet like removed successfully'))
    } else {
        const addLike = await Like.create({
            tweet: tweetId,
            likedBy: userId,
        })

        if(!addLike) {
            throw new ApiError(500, 'Failed to like tweet')
        }

        return res.
        status(200).
        json(new ApiResponse(201, addLike, 'Liked the tweet'))
    }
})

const getLikedVideos = asyncHandler(async(req, res) => {
    const {page = 1, limit = 20} = req.query
    const pageParse = parseInt(page, 10)
    const limitParse = parseInt(limit, 10)
    const userId = new mongoose.Types.ObjectId(req.user._id)

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: userId
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                            owner: 1
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullname: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $arrayElemAt: ["$owner, 0"]
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideos"
        },
        // {
        //     $replaceRoot: {
        //         newRoot: "$likedVideos"
        //     }
        // }, 
        {
            $sort: {createdAt: -1}
        },
        {
            $skip: (pageParse - 1) * limitParse
        },
        {
            $limit: limitParse
        }
    ])

    if(likedVideos.length === 0) {
        return res.
        status(200).
        json(new ApiResponse(200, [], "No liked videos"))
    }

    return res.
    status(200).
    json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}