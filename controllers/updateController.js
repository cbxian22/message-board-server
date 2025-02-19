const db = require("../config/db");

exports.updateUserProfile = (req, res) => {
  const { name } = req.params; // 這是舊的 username
  const { avatar, intro, name: newName } = req.body; // 從 body 取得新 username

  if (!avatar && !intro && !newName) {
    return res.status(400).json({ message: "請提供要更新的資料" });
  }

  // 確保新 username 不會跟舊 username 一樣，避免多餘的更新
  if (newName === name) {
    return res.status(400).json({ message: "新名稱與舊名稱相同" });
  }

  const updateFields = [];
  const values = [];

  if (avatar) {
    updateFields.push("avatar = ?");
    values.push(avatar);
  }

  if (intro) {
    updateFields.push("intro = ?");
    values.push(intro);
  }

  if (newName) {
    updateFields.push("name = ?");
    values.push(newName);
  }

  values.push(name); // 原本的 username，用來找到對應的使用者

  const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE name = ?`;

  // 先檢查新 username 是否已被使用
  if (newUsername) {
    db.query(
      "SELECT id FROM users WHERE name = ?",
      [newName],
      (err, results) => {
        if (err) {
          console.error("資料庫錯誤:", err);
          return res.status(500).json({ message: "伺服器錯誤" });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: "這個名稱已被使用" });
        }

        // 執行更新
        db.query(sql, values, (err, result) => {
          if (err) {
            console.error("更新使用者資料失敗:", err);
            return res.status(500).json({ message: "伺服器錯誤" });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "使用者不存在" });
          }

          res.status(200).json({ message: "使用者資料更新成功", newUsername });
        });
      }
    );
  } else {
    // 如果沒有要改 username，直接更新 avatar 和 intro
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("更新使用者資料失敗:", err);
        return res.status(500).json({ message: "伺服器錯誤" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "使用者不存在" });
      }

      res.status(200).json({ message: "使用者資料更新成功" });
    });
  }
};
