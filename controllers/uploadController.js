const { Storage } = require("@google-cloud/storage");
const credentials = JSON.parse(process.env.GCLOUD_KEYFILE);
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: credentials,
});

const bucketName = process.env.GCLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// 檢查桶是否存在
bucket.exists((err, exists) => {
  if (err) {
    console.error("無法檢查桶存在性", err);
    return;
  }
  if (!exists) {
    console.error("桶不存在");
  } else {
    console.log("桶存在，繼續設定路由");
  }
});

// 生成 Signed URL (供前端上傳檔案)
exports.generateSignedUrl = async (req, res) => {
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

    res
      .status(500)
      .json({ error: "生成 Signed URL 失敗", details: error.message });
  }
};
