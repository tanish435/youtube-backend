import mongoose from "mongoose";
import {ApiResponse} from '../utils/ApiResponse.js'
import {ApiError} from '../utils/ApiError.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {User} from '../models/user.model.js'
import {Video} from '../models/video.model.js'
import {Subscription} from '../models/subscription.model.js'

// TODO: Complete getChannelStats
const getChannelStats = asyncHandler(async(req, res) => {
    const channelStats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",                
            }
        },
        {
            $unwind: {
                path: "$videos",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "videos._id",
                foreignField: "video",
                as: "videos.likes"
            }
        },
        {
            $addFields: {
                "videos.likesCount": {$size: "$videos.likes"}
            }
        },
        {
            $group: {
                _id: "$_id",
                totalSubscribers: {$first: {$size: "$subscribers"}},
                totalVideos: {$sum: 1},
                totalViews: {$sum: "$videos.views"},
                totalLikes: {$sum: "$videos.likesCount"}
            }
        }
    ])

    if(!channelStats) {
        throw new ApiError(500, 'Unable to fetch channel stats')
    }

    return res.
    status(200).
    json(new ApiResponse(200, channelStats[0], "Channel Stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async(req, res) => {
    const userId = req.user._id

    const channelVideos = await Video.find({
        owner: new mongoose.Types.ObjectId(userId)
    })

    if(!channelVideos) {
        throw new ApiError(400, 'No videos available')
    }

    return res.
    status(200).
    json(new ApiResponse(200, channelVideos, 'Channel videos fetched successfully'))
})

export {
    getChannelStats,
    getChannelVideos
}