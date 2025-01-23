const express = require("express");
const loginController = require("../controllers/loginController");
const router = express.Router();

// 登入
router.post("/", loginController.login);

module.exports = router;
