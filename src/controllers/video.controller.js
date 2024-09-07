import mongoose, { isValidObjectId } from "mongoose";
import {ApiResponse} from '../utils/ApiResponse.js'
import {ApiError} from '../utils/ApiError.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import { deleteFileFromCloudinary, deleteVideoFileFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const getAllVideos = asyncHandler(async(req, res) => {
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query

    const limitParse = parseInt(limit, 10)
    const pageSkip = (page - 1) * limitParse
    const sortStage = {}
    sortStage[sortBy] = sortType === 'asc' ? 1 : -1

    const allVideo = await Video.aggregate([
        {
            $match: {
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerResult",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                ownerDetails: {
                    $arrayElemAt: ["$ownerResult", 0]
                }
            }
        },
        {
            $sort: sortStage
        },
        {
            $skip: pageSkip
        },
        {
            $limit: limitParse
        },
        {
            $project: {
                ownerResult: -1
            }
        }
    ])

    if(!allVideo) {
        throw new ApiError(400, 'No videos found')
    }

    return res.
    status(200).
    json(new ApiResponse(201, allVideo, 'Videos fetched successfully'))
})

const publishVideo = asyncHandler(async(req, res) => {
    const {title, description} = req.body
    const videoPath = req.files?.videoFile[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path

    if(!videoPath) {
        throw new ApiError(401, 'Video file is missing')
    }

    if(!thumbnailPath) {
        throw new ApiError(401, 'Thumbnail file is missing')
    }

    const video = await uploadOnCloudinary(videoPath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!video.url) {
        throw new ApiError(400, 'Failed to upload video file on cloudinary')
    }

    if(!thumbnail.url) {
        throw new ApiError(400, 'Failed to upload thumbnail file on cloudinary')
    }

    const createVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: video.duration,
        owner: new mongoose.Types.ObjectId(req.user._id)
    })

    if(!createVideo) {
        throw new ApiError(500, 'Unable to upload video')
    }

    return res.
    status(200).
    json(new ApiResponse(201, createVideo, 'Video uploaded successfully'))
})

const getVideoById = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video Id')
    }

    const video = await Video.findById(videoId).populate({
        path: "owner",
        select: "-password -refreshToken -watchHistory -coverImage"
    })

    if(!video) {
        throw new ApiError(400, 'Unable to get requested video')
    }

    return res.
    status(200).
    json(new ApiResponse(200, video, 'Video Fetched successfully'))
})

const updateVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const {title, description} = req.body
    const thumbnailLocalPath = req.file?.path

    if(!videoId) {
        throw new ApiError(400, 'Invalid video Id')
    }

    if(title === '' || description === '') {
        throw new ApiError(400, 'Title or description cannot be empty')
    }

    const oldVideo = await Video.findById(videoId)
    const oldThumbnailPath = oldVideo?.thumbnail

    let thumbnailFile;
    if(thumbnailLocalPath) {
        thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

        if(!thumbnailFile.url) {
            throw new ApiError(402, 'Unable to upload thumbnail on cloud')
        }

        await deleteFileFromCloudinary(oldThumbnailPath)
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnailFile?.url || oldThumbnailPath,
                title,
                description
            }
        },
        {new: true}
    )

    if(!updatedVideo) {
        throw new ApiError(500, 'Failed to update video')
    }

    return res.
    status(200).
    json(new ApiResponse(201, updatedVideo, 'Video updated successfully'))
})

const deleteVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video Id')
    }

    const videoToDelete = await Video.findById(videoId)
    if(!videoToDelete) {
        throw new ApiError(501, 'Video not found')
    }

    console.log(videoToDelete.videoFile);

    try {
        await deleteVideoFileFromCloudinary(videoToDelete.videoFile)
        await deleteFileFromCloudinary(videoToDelete.thumbnail)
    } catch (error) {
        throw new ApiError(500, 'Failed to delete video or thumbnail from cloudinary')
    }

    const videoDataDeleted = await Video.deleteOne({_id: videoId})

    if(videoDataDeleted.deletedCount === 0) {
        throw new ApiError(400, 'Video data cannot be deleted')
    }

    return res.
    status(200).
    json(new ApiResponse(200, {}, 'Video deleted successfully'))
})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video Id')
    }

    const video = await Video.findOne({
        _id: videoId, 
        owner: userId
    })

    if(!video) {
        throw new ApiError(400, 'Video not found OR you are not authorised')
    }

    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave: false})

    return res.
    status(200).
    json(new ApiResponse(200, video, "Toggled publish status"))
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}