const express = require("express");
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.post("/:userId", authMiddleware, postController.createPost);

router.get("/", authMiddleware, postController.getAllPosts);

router.get("/friends", authMiddleware, postController.getFriendsPosts);

router.get("/:postId", authMiddleware, postController.getPostById);

router.get(
  "/user/:accountname",
  authMiddleware,
  postController.getPostsByAccountname
);

router.put("/:postId/:userId", authMiddleware, postController.updatePost);

router.delete("/:postId/:userId", authMiddleware, postController.deletePost);

module.exports = router;
