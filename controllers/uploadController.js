const { Storage } = require("@google-cloud/storage");

// const credentials = JSON.parse(process.env.GCLOUD_KEYFILE);

// 檢查並解析 GCLOUD_KEYFILE
let credentials;
try {
  if (!process.env.GCLOUD_KEYFILE) {
    throw new Error("環境變數 GCLOUD_KEYFILE 未設定");
  }
  credentials = JSON.parse(process.env.GCLOUD_KEYFILE);
} catch (error) {
  console.error("解析 GCLOUD_KEYFILE 失敗:", error.message);
  throw error; // 讓程式停止，提醒修環境變數
}

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: credentials,
});

const bucketName = process.env.GCLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

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
