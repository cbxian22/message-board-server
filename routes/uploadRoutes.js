// const express = require("express");
// const uploadController = require("../controllers/uploadController");
// const multer = require("multer");
// const upload = multer(); // 使用內存儲存

// const router = express.Router();

// // 上傳檔案
// router.post("/", upload.single("file"), uploadController.uploadFile);

// module.exports = router;

// uploadRoutes.js
const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../config/storage"); // 引入你剛剛寫好的上傳圖片的函數

const router = express.Router();

// 設定 multer 存儲引擎，這裡存儲於記憶體中（稍後會上傳到 GCS）
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 上傳圖片路由
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    // 上傳圖片到 GCS 並取得圖片 URL
    const fileName = `images/${Date.now()}-${req.file.originalname}`;
    const imageUrl = await uploadImage(req.file.buffer, fileName);

    // 儲存圖片 URL 到資料庫，這裡假設你有一個 `posts` 表格來儲存貼文
    // 假設你有 `Post` 模型並使用 ORM (例如 Sequelize)
    // 例如：Post.create({ imageUrl });

    res.status(200).send({ imageUrl });
  } catch (error) {
    console.error("Image upload failed:", error);
    res.status(500).send("Failed to upload image.");
  }
});

module.exports = router;
