const express = require("express");
const router = express.Router();
const replyController = require("../controllers/replyController");
const authMiddleware = require("../middleware/auth");

router.post("/:postId/:userId", authMiddleware, replyController.createReply);

router.get("/", authMiddleware, replyController.getAllReplies);

router.get("/:postId", authMiddleware, replyController.getRepliesByPost);

router.put("/:replyId/:userId", authMiddleware, replyController.updateReply);

router.delete("/:replyId/:userId", authMiddleware, replyController.deleteReply);

module.exports = router;
