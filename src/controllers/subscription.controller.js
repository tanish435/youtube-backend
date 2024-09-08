import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async(req, res) => {
    const {channelId} = req.params
    const userId = new mongoose.Types.ObjectId(req.user._id)

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, 'Channel Id not found')
    }

    const subscribed = await Subscription.findOne({subscriber: userId, channel: channelId})

    if(subscribed) {
        const removeSubscription = await Subscription.deleteOne({channel: channelId, subscriber: userId})

        if(!removeSubscription) {
            throw new ApiError(400, 'Failed to remove subscription')
        }

        return res.
        status(200).
        json(new ApiResponse(201, [], 'Subscription removed successfully'))
    } else {
        const addSubscription = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })

        if(!addSubscription) {
            throw new ApiError(500, 'Failed to add subscription')
        }

        return res.
        status(200).
        json(new ApiResponse(201, addSubscription, 'Subscription added successfully'))
    }
})

const getUserChannelSubscribers = asyncHandler(async(req, res) => {
    const {channelId} = req.params
    const userId = req.user._id
    const {page = 1, limit = 10} = req.query
    const pageParse = parseInt(page, 10)
    const limitParse = parseInt(limit, 10)

    if(channelId !== String(userId)) {
        return res.
        status(403).
        json(new ApiResponse(403, [], 'You are not authorized to get the channel subscribers'))
    }

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, 'Invalid channel Id')
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            avatar: 1,
                            fullname: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribers"
        },
        {
            $replaceRoot: {newRoot: "$subscribers"}
        },
        {
            $sort: {createdAt: 1}
        },
        {
            $skip: (pageParse - 1) * limitParse
        }, 
        {
            $limit: limitParse
        }
    ])

    if(!subscribers || subscribers.length === 0) {
        return res.
        status(200).
        json(new ApiResponse(200, [], 'Subscribers not found'))
    }

    return res.
    status(200).
    json(new ApiResponse(200, subscribers, 'Channel subscribers fetched successfully'))
})

const getSubscribedChannels = asyncHandler(async(req, res) => {
    const {subscriberId} = req.params
    const userId = req.user._id
    const {page = 1, limit = 10} = req.query
    const pageParse = parseInt(page, 10)
    const limitParse = parseInt(limit, 10)

    // Optional
    if (subscriberId !== String(userId)) {
        return res
        .status(403)
        .json(new ApiResponse(403, [], 'You are not authorized to view these subscriptions'));
    }

    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, 'Invalid subscriber Id')
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedTo"
        },
        {
            $replaceRoot: {newRoot: "$subscribedTo"}
        },
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

    if(!subscribedChannels || subscribedChannels.length === 0) {
        return res.
        status(200).
        json(new ApiResponse(200, [], 'No channels subscribed'))
    }

    return res.
    status(200).
    json(new ApiResponse(200, subscribedChannels, 'Fetched subscribed channels successfully'))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}