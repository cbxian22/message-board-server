const express = require("express");
const {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/register", register);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

module.exports = router;
