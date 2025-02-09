const express = require("express");
const userController = require("../controllers/userController");
const { authenticateJWT } = require("../middleware/authenticateJWT");

const router = express.Router();

// 註冊
router.post("/register", userController.registerUser);

// 登入
router.post("/login", userController.loginUser);

// 更新使用者角色（管理者專用）
router.put("/role/:id", authenticateJWT, userController.updateUserRole);

module.exports = router;
