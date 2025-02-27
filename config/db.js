const mysql = require("mysql2/promise");
require("dotenv").config();

// 建立連線池
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 20,
  waitForConnections: true,
  connectTimeout: 10000,
});

// 測試連線（啟動時跑一次）
db.getConnection()
  .then((connection) => {
    console.log("已成功連線到資料庫");
    connection.release();
  })
  .catch((err) => console.error("資料庫連線錯誤:", err));

// 週期性 Ping
function pingMySQL() {
  db.query("SELECT 1")
    .then(() => console.log("MySQL 週期性每5分鐘 ping 一次"))
    .catch((err) => console.error("MySQL 週期性每5分鐘 ping 一次失敗:", err));
}

// 每 5 分鐘 ping 一次
setInterval(pingMySQL, 300000);
pingMySQL();

module.exports = db;
