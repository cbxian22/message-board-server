// routes/friendRoutes.js
const express = require("express");
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriend,
  getFriends,
  getFriendStatus,
  getPendingRequest,
} = require("../controllers/friendController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.post("/request", authMiddleware, sendFriendRequest);
router.put("/accept/:requestId", authMiddleware, acceptFriendRequest);
router.put("/reject/:requestId", authMiddleware, rejectFriendRequest);
router.delete("/:friendId", authMiddleware, deleteFriend);
router.get("/", authMiddleware, getFriends);
router.get("/status/:friendId", authMiddleware, getFriendStatus);
router.get("/pending/:friendId", authMiddleware, getPendingRequest);

module.exports = router;
