const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
  connectionLimit: 10, // 允許最多 10 個連線
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true, // 如果沒有可用連線，等待連線釋放
  queueLimit: 0, // 0 表示無限等待請求
});

// db.connect((err) => {
//   if (err) {
//     console.error("資料庫連線錯誤: ", err); // 顯示具體錯誤訊息
//     return;
//   }
//   console.log("已成功連線到資料庫");
// });
// 測試連線
db.getConnection((err, connection) => {
  if (err) {
    console.error("資料庫連線錯誤: ", err);
    return;
  }
  console.log("已成功連線到資料庫");
  connection.release(); // 測試完畢後釋放連線
});

// 每 5 分鐘 Ping 一次 MySQL，保持連線活躍
setInterval(() => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("獲取 MySQL 連線失敗:", err);
      return;
    }
    console.log("執行 MySQL ping...");
    connection.ping((error) => {
      if (error) console.error("Ping 失敗:", error);
      connection.release();
    });
  });
}, 300000); // 300000 毫秒 = 5 分鐘

module.exports = db;
