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
router.post("/register", register);
router.post("/logout", logout); // 新增登出路由
router.post("/refresh-token", refreshToken);
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;
