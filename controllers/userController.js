const db = require("../config/db");

// 取得使用者資訊（透過 username）
exports.getUserByUsername = (req, res) => {
  const { name } = req.params;

  db.query(
    "SELECT id, name, account, intro, avatar_url ,role FROM users WHERE name = ?",
    [name],
    (err, results) => {
      if (err) {
        console.error("資料庫錯誤:", err);
        return res.status(500).json({ message: "伺服器錯誤" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "使用者不存在" });
      }

      res.status(200).json(results[0]); // 回傳使用者資料
    }
  );
};
