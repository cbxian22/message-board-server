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
