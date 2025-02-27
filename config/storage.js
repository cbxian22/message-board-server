const { Storage } = require("@google-cloud/storage");
require("dotenv").config();

// 檢查環境變數
const requiredEnvVars = [
  "GCLOUD_PROJECT_ID",
  "GCLOUD_KEYFILE",
  "GCLOUD_BUCKET_NAME",
];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`缺少環境變數: ${varName}`);
  }
});

// 初始化 Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEYFILE,
});

// 取得 Bucket
const bucketName = process.env.GCLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// 上傳圖片到 GCS
const uploadImage = async (filePath, destination) => {
  try {
    await bucket.upload(filePath, {
      destination: destination,
      public: true,
    });

    const imageUrl = `https://storage.googleapis.com/${process.env.GCLOUD_BUCKET_NAME}/${destination}`;
    console.log("Image uploaded successfully:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

module.exports = { uploadImage };
