const { Storage } = require("@google-cloud/storage");
require("dotenv").config();
const path = require("path");

// 初始化 Google Cloud Storage 客戶端
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEYFILE,
});

// 取得 Bucket
const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME);

// 上傳圖片到 GCS
const uploadImage = async (filePath, destination) => {
  try {
    // 上傳文件到指定的目的地並設置為公開
    await bucket.upload(filePath, {
      destination: destination, // 上傳後的文件路徑
      public: true, // 設置為公開
    });

    // 取得圖片 URL
    const imageUrl = `https://storage.googleapis.com/${process.env.GCLOUD_BUCKET_NAME}/${destination}`;
    console.log("Image uploaded successfully:", imageUrl);
    return imageUrl; // 返回圖片 URL
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error; // 處理錯誤
  }
};

// 導出函數
module.exports = { uploadImage };
