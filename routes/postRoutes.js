const express = require("express");
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// 創建帖子
// router.post("/:userId", postController.createPost);
router.post("/:userId", authMiddleware, postController.createPost);

// 獲取所有帖子
// router.get("/", postController.getAllPosts);
router.get("/", authMiddleware, postController.getAllPosts); // 添加 authMiddleware

// 新增好友頁路由
router.get("/friends", authMiddleware, postController.getFriendsPosts);

// 獲取單一帖子
// router.get("/:postId", postController.getPostById);
router.get("/:postId", authMiddleware, postController.getPostById);

// 获取指定用户名的所有帖子
// router.get("/user/:name", postController.getPostsByUsername);
router.get(
  "/user/:accountname",
  authMiddleware,
  postController.getPostsByAccountname
); // 添加 authMiddleware

// 修改帖子
// router.put("/:postId/:userId", postController.updatePost);
router.put("/:postId/:userId", authMiddleware, postController.updatePost);

// 刪除帖子
// router.delete("/:postId/:userId", postController.deletePost);
router.delete("/:postId/:userId", authMiddleware, postController.deletePost);

module.exports = router;
