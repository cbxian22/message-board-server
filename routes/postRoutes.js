const express = require("express");
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// 創建帖子
router.post("/:userId", postController.createPost);

// 獲取所有帖子
router.get("/", postController.getAllPosts);

// 獲取單一帖子
router.get("/:postId", postController.getPostById);

// 获取指定用户名的所有帖子
// router.get("/user/:name", postController.getPostsByUsername);
router.get("/user/:name", authMiddleware, postController.getPostsByUsername); // 添加 authMiddleware

// 修改帖子
router.put("/:postId/:userId", postController.updatePost);

// 刪除帖子
router.delete("/:postId/:userId", postController.deletePost);

module.exports = router;
