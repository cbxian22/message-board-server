const express = require("express");
const replyController = require("../controllers/replyController");
const router = express.Router();

// 創建回覆
router.post("/:postId/:userId", replyController.createReply);

// 獲取所有回覆
router.get("/", replyController.getAllReplies);

// 獲取指定帖子的回覆
router.get("/:postId", replyController.getRepliesByPost);

// 修改回覆
router.put("/:replyId/:userId", replyController.updateReply);

// 刪除回覆
router.delete("/:replyId/:userId", replyController.deleteReply);

module.exports = router;
