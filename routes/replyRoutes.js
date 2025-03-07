// routes/replyRoutes.js
const express = require("express");
const router = express.Router();
const replyController = require("../controllers/replyController");
const authMiddleware = require("../middleware/auth");

// 創建回覆（需要身份驗證）
router.post("/:postId/:userId", authMiddleware, replyController.createReply);

// 獲取所有回覆（不需要身份驗證）
router.get("/", replyController.getAllReplies);

// 獲取指定帖子的回覆（不需要身份驗證）
router.get("/:postId", replyController.getRepliesByPost);

// 修改回覆（需要身份驗證）
router.put("/:replyId/:userId", authMiddleware, replyController.updateReply);

// 刪除回覆（需要身份驗證）
router.delete("/:replyId/:userId", authMiddleware, replyController.deleteReply);

module.exports = router;
