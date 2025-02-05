const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
  connectionLimit: 20, // 允許最多 20 個連線
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true, // 如果沒有可用連線，等待連線釋放
  queueLimit: 0, // 0 表示無限等待請求
  connectTimeout: 10000, // **設定 10 秒連線超時**
  enableKeepAlive: true, // **保持 MySQL 連線活躍**
  keepAliveInitialDelay: 10000, // **每 10 秒發送 Keep-Alive**
});

// 測試連線
db.getConnection((err, connection) => {
  if (err) {
    console.error("資料庫連線錯誤: ", err);
    return;
  }
  console.log("已成功連線到資料庫");
  connection.release(); // 測試完畢後釋放連線
});

function pingMySQL() {
  console.log(`⏳ [${new Date().toISOString()}] 測試 Ping MySQL...`);
  db.query("SELECT 1", (err) => {
    if (err) {
      console.error("❌ MySQL Ping 失敗:", err);
    } else {
      console.log(`✅ [${new Date().toISOString()}] MySQL 仍然活躍`);
    }
  });

  setTimeout(pingMySQL, 300000); // 10 秒後再執行
}

pingMySQL(); // 啟動函數

module.exports = db;
