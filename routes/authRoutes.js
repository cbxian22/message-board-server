// const express = require("express");
// const {
//   login,
//   register,
//   refreshToken,
// } = require("../controllers/authController");
// const router = express.Router();

// router.post("/login", login);
// router.post("/register", register);
// router.post("/refresh-token", refreshToken);

// module.exports = router;

const express = require("express");
const {
  login,
  register,
  refreshToken,
  getCurrentUser,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.post("/login", login);
router.post("/register", register); // 假設你有註冊功能
router.post("/refresh-token", refreshToken);
router.get("/me", authMiddleware, getCurrentUser); // 獲取當前用戶資訊

module.exports = router;
