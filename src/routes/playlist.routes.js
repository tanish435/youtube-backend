import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router()
router.use(verifyJWT)

router.route('/create-playlist').post(createPlaylist)
router.route('/get-user-playlists/c/:userId').get(getUserPlaylists)
router.route('/get-playlist-by-id/c/:playlistId').get(getPlaylistById)
router.route('/add-video/c/:playlistId/:videoId').patch(addVideoToPlaylist)
router.route('/remove-video/c/:playlistId/:videoId').patch(removeVideoFromPlaylist)
router.route('/delete-playlist/c/:playlistId').delete(deletePlaylist)
router.route('/update-playlist/c/:playlistId').patch(updatePlaylist)

export default router