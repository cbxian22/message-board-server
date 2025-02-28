// 用戶管理（查詢、更新個人資料、刪除）

const db = require("../config/db");

// 取得使用者資訊（根據名稱）
exports.getUserByUsername = (req, res) => {
  const { name } = req.params;
  db.query(
    "SELECT id, name, account, intro, avatar_url, role, is_private FROM users WHERE name = ?",
    [name],
    (err, results) => {
      if (err) {
        console.error("資料庫查詢錯誤:", err);
        return res.status(500).json({ message: "伺服器錯誤" });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "使用者不存在" });
      }
      res.status(200).json(results[0]);
    }
  );
};

// 更新使用者資料
exports.updateUserProfile = (req, res) => {
  const userId = req.user.userId;
  const { name, intro, fileUrl, isPrivate } = req.body;

  if (!fileUrl && !intro && !name && isPrivate === undefined) {
    return res.status(400).json({ message: "請提供要更新的資料" });
  }

  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "伺服器錯誤" });
    if (results.length === 0)
      return res.status(404).json({ message: "使用者不存在" });

    if (name && name !== results[0].name) {
      db.query(
        "SELECT id FROM users WHERE name = ?",
        [name],
        (err, nameResults) => {
          if (err) return res.status(500).json({ message: "伺服器錯誤" });
          if (nameResults.length > 0)
            return res.status(400).json({ message: "這個名稱已被使用" });
          updateUser(res, userId, name, intro, fileUrl, isPrivate);
        }
      );
    } else {
      updateUser(res, userId, null, intro, fileUrl, isPrivate);
    }
  });
};

// 更新使用者資料的輔助函數
const updateUser = (res, userId, newName, intro, fileUrl, isPrivate) => {
  const updateFields = [];
  const values = [];

  if (fileUrl !== undefined) {
    updateFields.push("avatar_url = ?");
    values.push(fileUrl);
  }
  if (intro !== undefined) {
    updateFields.push("intro = ?");
    values.push(intro);
  }
  if (newName) {
    updateFields.push("name = ?");
    values.push(newName);
  }
  if (isPrivate !== undefined) {
    updateFields.push("is_private = ?");
    values.push(isPrivate);
  }
  values.push(userId);

  const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: "伺服器錯誤" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "使用者不存在" });
    res
      .status(200)
      .json({ message: "使用者資料更新成功", newName: newName || null });
  });
};

// 刪除使用者
// exports.deleteUser = (req, res) => {
//   const userId = req.user.userId; // 從 middleware 提取
//   db.query("DELETE FROM posts WHERE user_id = ?", [userId], (err) => {
//     if (err) return res.status(500).json({ message: "伺服器錯誤" });

//     db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
//       if (err) return res.status(500).json({ message: "伺服器錯誤" });
//       if (result.affectedRows === 0)
//         return res.status(404).json({ message: "使用者不存在" });
//       res.status(200).json({ message: "使用者已成功刪除" });
//     });
//   });
// };
exports.deleteUser = (req, res) => {
  const userId = req.user.userId;
  db.query("DELETE FROM posts WHERE user_id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "伺服器錯誤" });

    db.query(
      "DELETE FROM refresh_tokens WHERE user_id = ?",
      [userId],
      (err) => {
        if (err) return res.status(500).json({ message: "伺服器錯誤" });

        db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
          if (err) return res.status(500).json({ message: "伺服器錯誤" });
          if (result.affectedRows === 0)
            return res.status(404).json({ message: "使用者不存在" });
          res.status(200).json({ message: "使用者已成功刪除" });
        });
      }
    );
  });
};
