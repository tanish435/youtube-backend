import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiResponse} from '../utils/ApiResponse.js'
import {ApiError} from '../utils/ApiError.js'
import { Playlist } from '../models/playlist.model.js';
import mongoose, { isValidObjectId } from 'mongoose';

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user._id
    const {videos} = req.body

    if(!name || !description) {
        throw new ApiError(400, 'Name or description are required')
    }

    if(!videos || videos.length < 1) {
        throw new ApiError(400, 'Minimum one video is required to create playlist')
    }

    const videoIds = videos.map(videoId => {
        return new mongoose.Types.ObjectId(videoId)
    })

    const playlist = await Playlist.create({
        name,
        videos: videoIds,
        owner: userId,
        description
    })

    if(!playlist) {
        throw new ApiError(500, 'Playlist not created')
    }

    return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {page = 1, limit = 10} = req.query
    const pageParse = parseInt(page, 10)
    const limitParse = parseInt(limit, 10)

    const validUserId = new mongoose.Types.ObjectId(userId)

    if(!isValidObjectId(validUserId)) {
        throw new ApiError(400, 'User Id is not valid')
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: validUserId
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $skip: (pageParse - 1) * limitParse
        },
        {
            $limit: limitParse
        }
    ])

    if(playlists.length < 1) {
        return res
        .status(200)
        .json(new ApiResponse(201, [], "No playlist created by the user"))
    }

    return res.
    status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId) {
        throw new ApiError(400, 'Playlist ID not found')
    }

    const playlistObjectId = new mongoose.Types.ObjectId(playlistId)

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: playlistObjectId
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
        }
    ])

    if(!playlist || playlist.length < 1) {
        throw new ApiError(404, 'Playlist not found')
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId) {
        throw new ApiError(400, 'Playlist ID is required')
    }
    if(!videoId) {
        throw new ApiError(400, 'Video ID is required to add') 
    }

    const playlistObjectId = new mongoose.Types.ObjectId(playlistId)
    const videoObjectId = new mongoose.Types.ObjectId(videoId)

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistObjectId,
        {
            $push: {
                videos: videoObjectId
            }
        },
        {new: true}
    )

    if(!updatedPlaylist) {
        throw new ApiError(500, 'Failed to add video to playlist')
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId) {
        throw new ApiError(400, 'Playlist ID or Video ID are required')
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        new mongoose.Types.ObjectId(playlistId),
        {
            $pull: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {new: true}
    )

    if(!updatedPlaylist) {
        throw new ApiError(400, 'Failed to remove video from playlist')
    }

    return res.
    status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId) {
        throw new ApiError(400, 'Playlist ID not found')
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist) {
        throw new ApiError(500, 'Playlist delete request failed')
    }

    return res
    .status(200)
    .json(new ApiResponse(200, [], 'Playlist deleted successfully'))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId) {
        throw new ApiError(400, 'Playlist ID not found')
    }

    if(!description || !name) {
        throw new ApiError(400, 'Playlist name and description is required')
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {new: true}
    )

    if(!updatedPlaylist) {
        throw new ApiError(500, 'Playlist not updated')
    }

    return res
    .status(200)
    .json(new ApiResponse(201, updatedPlaylist, 'Playlist updated successfully'))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    deletePlaylist,
    updatePlaylist,
    removeVideoFromPlaylist
}