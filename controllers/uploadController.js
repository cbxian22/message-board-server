// const bucket = require("../config/storage");
// const { v4: uuidv4 } = require("uuid");

// // 上傳檔案
// exports.uploadFile = (req, res) => {
//   const file = req.file;

//   if (!file) {
//     return res.status(400).json({ error: "請選擇檔案" });
//   }

//   const fileName = uuidv4() + "." + file.mimetype.split("/")[1]; // 使用 UUID 生成唯一檔名
//   const fileUpload = bucket.file(fileName);

//   const stream = fileUpload.createWriteStream({
//     metadata: {
//       contentType: file.mimetype,
//     },
//   });

//   stream.on("finish", () => {
//     const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
//     res.status(200).json({ fileUrl });
//   });

//   stream.on("error", (err) => {
//     res.status(500).json({ error: "檔案上傳失敗" });
//   });

//   stream.end(file.buffer);
// };
const { Storage } = require("@google-cloud/storage");
const express = require("express");
const router = express.Router();

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEYFILE,
});

const bucketName = process.env.GCLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// 取得 Signed URL (供前端上傳檔案)
router.get("/generate-signed-url", async (req, res) => {
  const { filename, contentType } = req.query;
  if (!filename || !contentType) {
    return res.status(400).json({ error: "缺少 filename 或 contentType" });
  }

  const file = bucket.file(filename);
  const options = {
    version: "v4",
    action: "write",
    expires: Date.now() + 5 * 60 * 1000, // 5 分鐘後過期
    contentType: contentType,
  };

  try {
    const [url] = await file.getSignedUrl(options);
    res.json({
      uploadUrl: url,
      fileUrl: `https://storage.googleapis.com/${bucketName}/${filename}`,
    });
  } catch (error) {
    console.error("生成 Signed URL 失敗:", error);
    res.status(500).json({ error: "生成 Signed URL 失敗" });
  }
});

module.exports = router;
