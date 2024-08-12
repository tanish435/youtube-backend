import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async(req, res) =>{
    const {page = 1, limit = 10} = req.query
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    const {videoId} = req.params

    if(!videoId) {
        throw new ApiError(404, "Video does not exist")
    }

    const videoComments = await Comment.aggregate([
        {
            $match: {
                video: videoId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[{
                    $project: {
                        avatar: 1,
                        username: 1,
                        fullname: 1
                    }
                }]
            }
        }, 
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        },
    ])

    if(videoComments.length < 1) {
        return res
        .status(200)
        .json(new ApiResponse(200, videoComments, "No comments"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videoComments, "Video comments"))
})

const addComment = asyncHandler(async (req, res) => { 
    const user = new mongoose.Types.ObjectId(req.user?._id)
    const {content} = req.body
    const {videoId} = req.params
    
    if(!user) {
        return new ApiError(401, "Login to add comment")
    }
    
    if(!content) {
        return new ApiError(400, "Content is required")
    }

    if(!videoId) {
        return new ApiError(400, "Video id not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: user
    })

    if(!comment) {
        throw new ApiError(500, "Failed to add comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment posted successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const {comment} = req.body
    const {commentId} = req.params

    if(!commentId) {
        throw new ApiError(400, "Comment id not found")
    }

    if(!comment) {
        throw new ApiError(400, "Updated comment is required")
    }

    const newComment = await Comment.findOneAndUpdate(
        {
            _id: commentId
        },
        {
            $set: {
                content: comment
            }
        },
        {
            new: true
        }
    )

    if(!newComment) {
        throw new ApiError(400, "Failed to update comment")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment updated"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!commentId) {
        throw new ApiError(404, "Comment id not found")
    }

    const deletedComment = await Comment.findOneAndDelete(
        {
            _id: commentId,
        }
    )

    if(!deletedComment) {
        throw new ApiError(400, "Failed to delete comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
}