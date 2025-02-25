// 用戶管理（查詢、更新個人資料、刪除）

const db = require("../config/db");

// 取得使用者資訊（根據名稱）
exports.getUserByUsername = (req, res) => {
  const { name } = req.params;
  db.query(
    "SELECT id, name, account, intro, avatar_url, role FROM users WHERE name = ?",
    [name],
    (err, results) => {
      if (err) return res.status(500).json({ message: "伺服器錯誤" });
      if (results.length === 0)
        return res.status(404).json({ message: "使用者不存在" });
      res.status(200).json(results[0]);
    }
  );
};

// 獲取當前用戶資訊 （從 auth middleware 提取 userId）
exports.getCurrentUser = (req, res) => {
  const userId = req.user.userId;
  console.log("getCurrentUser: userId =", userId); // 添加日誌
  db.query(
    "SELECT id, name, account, intro, avatar_url, role FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "伺服器錯誤" });
      }
      if (results.length === 0) {
        console.log(`No user found for userId: ${userId}`);
        return res.status(404).json({ message: "用戶不存在" });
      }
      res.status(200).json(results[0]);
    }
  );
};

// 更新使用者資料
exports.updateUserProfile = (req, res) => {
  const userId = req.user.userId; // 從 middleware 提取
  const { name, intro, fileUrl } = req.body;

  if (!fileUrl && !intro && !name) {
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
          updateUser(res, userId, name, intro, fileUrl);
        }
      );
    } else {
      updateUser(res, userId, null, intro, fileUrl);
    }
  });
};

// 更新使用者資料的輔助函數
const updateUser = (res, userId, newName, intro, fileUrl) => {
  const updateFields = [];
  const values = [];

  if (fileUrl) {
    updateFields.push("avatar_url = ?");
    values.push(fileUrl);
  }
  if (intro) {
    updateFields.push("intro = ?");
    values.push(intro);
  }
  if (newName) {
    updateFields.push("name = ?");
    values.push(newName);
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
exports.deleteUser = (req, res) => {
  const userId = req.user.userId; // 從 middleware 提取
  db.query("DELETE FROM posts WHERE user_id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "伺服器錯誤" });

    db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
      if (err) return res.status(500).json({ message: "伺服器錯誤" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "使用者不存在" });
      res.status(200).json({ message: "使用者已成功刪除" });
    });
  });
};
