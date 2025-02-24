// const express = require("express");
// const {
//   getUserByUsername,
//   updateUserProfile,
//   deleteUser,
// } = require("../controllers/userController");

// const router = express.Router();

// router.get("/:name", getUserByUsername);
// router.put("/:name", updateUserProfile);
// router.delete("/:name", deleteUser);

// module.exports = router;
const express = require("express");
const {
  getUserByUsername,
  updateUserProfile,
  deleteUser,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.get("/:name", getUserByUsername); // 公開路由，根據名稱獲取用戶資訊
router.put("/profile", authMiddleware, updateUserProfile); // 受保護路由，更新用戶資料
router.delete("/profile", authMiddleware, deleteUser); // 受保護路由，刪除用戶

module.exports = router;
