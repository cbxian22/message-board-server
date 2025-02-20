// // 取得使用者資訊
// const db = require("../config/db");
// exports.getUserByUsername = (req, res) => {
//   const { name } = req.params;

//   db.query(
//     "SELECT id, name, account, intro, avatar_url ,role FROM users WHERE name = ?",
//     [name],
//     (err, results) => {
//       if (err) {
//         console.error("資料庫錯誤:", err);
//         return res.status(500).json({ message: "伺服器錯誤" });
//       }

//       if (results.length === 0) {
//         return res.status(404).json({ message: "使用者不存在" });
//       }

//       res.status(200).json(results[0]); // 回傳使用者資料
//     }
//   );
// };

const db = require("../config/db");

// 取得使用者資訊
exports.getUserByUsername = (req, res) => {
  const { name } = req.params;

  db.query(
    "SELECT id, name, account, intro, avatar_url, role FROM users WHERE name = ?",
    [name],
    (err, results) => {
      if (err) {
        console.error("資料庫錯誤:", err);
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
  const { name } = req.params;
  const { name: newName, intro, fileUrl } = req.body;

  if (!fileUrl && !intro && !newName) {
    return res.status(400).json({ message: "請提供要更新的資料" });
  }

  db.query("SELECT * FROM users WHERE name = ?", [name], (err, results) => {
    if (err) {
      console.error("資料庫錯誤:", err);
      return res.status(500).json({ message: "伺服器錯誤" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "使用者不存在" });
    }

    if (newName && newName !== name) {
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

          return updateUser(res, name, newName, intro, fileUrl);
        }
      );
    } else {
      return updateUser(res, name, null, intro, fileUrl);
    }
  });
};

// 更新使用者資料的輔助函數
const updateUser = (res, name, newName, intro, fileUrl) => {
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

  values.push(name);

  const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE name = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("更新使用者資料失敗:", err);
      return res.status(500).json({ message: "伺服器錯誤" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "使用者不存在" });
    }

    res
      .status(200)
      .json({ message: "使用者資料更新成功", newName: newName || name });
  });
};

// 刪除使用者
// exports.deleteUser = (req, res) => {
//   const { name } = req.params;

//   db.query("DELETE FROM users WHERE name = ?", [name], (err, result) => {
//     if (err) {
//       console.error("刪除使用者失敗:", err);
//       return res.status(500).json({ message: "伺服器錯誤" });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "使用者不存在" });
//     }

//     res.status(200).json({ message: "使用者已成功刪除" });
//   });
// };
exports.deleteUser = (req, res) => {
  const { name } = req.params;

  // 先查詢使用者 ID
  db.query("SELECT id FROM users WHERE name = ?", [name], (err, results) => {
    if (err) {
      console.error("查詢使用者失敗:", err);
      return res.status(500).json({ message: "伺服器錯誤" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "使用者不存在" });
    }

    const userId = results[0].id;

    // 先刪除該使用者的留言
    db.query("DELETE FROM posts WHERE user_id = ?", [userId], (err) => {
      if (err) {
        console.error("刪除留言失敗:", err);
        return res.status(500).json({ message: "伺服器錯誤" });
      }

      // 再刪除使用者
      db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) {
          console.error("刪除使用者失敗:", err);
          return res.status(500).json({ message: "伺服器錯誤" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "使用者不存在" });
        }

        res.status(200).json({ message: "使用者已成功刪除" });
      });
    });
  });
};
