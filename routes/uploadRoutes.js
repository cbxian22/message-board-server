const express = require("express");
const uploadController = require("../controllers/uploadController");
const multer = require("multer");
const upload = multer(); // 使用內存儲存

const router = express.Router();

// 上傳檔案
router.post("/", upload.single("file"), uploadController.uploadFile);

module.exports = router;
