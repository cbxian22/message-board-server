const express = require("express");
const postController = require("../controllers/postController");
const router = express.Router();

// 創建帖子
router.post("/:userId", postController.createPost);

// 獲取所有帖子
router.get("/", postController.getAllPosts);

// 獲取單一帖子
router.get("/:postId", postController.getPostById);

// 獲取指定用戶的所有帖子
router.get("/user/:userId", postController.getPostsByUserId);

// 修改帖子
router.put("/:postId/:userId", postController.updatePost);

// 刪除帖子
router.delete("/:postId/:userId", postController.deletePost);

module.exports = router;
