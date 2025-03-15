const express = require("express");
const {
  getUserByAccountname,
  updateUserProfile,
  deleteUser,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.get("/:accountname", getUserByAccountname);
router.put("/profile", authMiddleware, updateUserProfile);
router.delete("/profile", authMiddleware, deleteUser);

module.exports = router;
