import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const router = Router()

router.route('/add-comment').post(verifyJWT, addComment)
router.route('/update-comment/c/:commentId').patch(verifyJWT, updateComment)
router.route('/delete-comment/c/:commentId').post(verifyJWT, deleteComment)
router.route('/get-comments/c/:videoId').get(verifyJWT, getVideoComments)

export default router