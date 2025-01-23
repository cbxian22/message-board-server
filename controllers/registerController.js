const bcrypt = require("bcrypt");
const db = require("../config/db");

// 註冊新用戶
exports.register = async (req, res) => {
  const { name, username, password, role } = req.body; // 加入 name

  try {
    // 檢查用戶名是否已經存在
    db.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      async (err, results) => {
        if (err) {
          console.error("資料庫錯誤:", err);
          return res.status(500).json({ message: "伺服器錯誤" });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: "用戶名已經存在" });
        }

        // 密碼加密
        const hashedPassword = await bcrypt.hash(password, 10);

        // 儲存新用戶資料
        db.query(
          "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
          [name, username, hashedPassword, role],
          (err, result) => {
            if (err) {
              console.error("資料庫錯誤:", err);
              return res.status(500).json({ message: "註冊失敗" });
            }
            res.status(201).json({ success: true });
          }
        );
      }
    );
  } catch (error) {
    console.error("伺服器錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};
