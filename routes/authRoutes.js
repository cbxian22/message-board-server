const express = require("express");
// const { login, register } = require("../controllers/authController");
const {
  login,
  register,
  refreshToken,
} = require("../controllers/authController");
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/refresh-token", refreshToken);

module.exports = router;
