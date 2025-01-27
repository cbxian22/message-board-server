const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error("資料庫連線錯誤: ", err); // 顯示具體錯誤訊息
    return;
  }
  console.log("已成功連線到資料庫");
});

module.exports = db;
