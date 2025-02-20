// const db = require("../config/db");

// exports.updateUserProfile = (req, res) => {
//   const { name } = req.params;
//   const { name: newName, intro, fileUrl } = req.body;

//   if (!fileUrl && !intro && !newName) {
//     return res.status(400).json({ message: "請提供要更新的資料" });
//   }

//   if (newName === name) {
//     return res.status(400).json({ message: "新名稱與舊名稱相同" });
//   }

//   const updateFields = [];
//   const values = [];

//   if (fileUrl) {
//     updateFields.push("avatar = ?");
//     values.push(fileUrl);
//   }

//   if (intro) {
//     updateFields.push("intro = ?");
//     values.push(intro);
//   }

//   if (newName) {
//     updateFields.push("name = ?");
//     values.push(newName);
//   }

//   values.push(name);

//   const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE name = ?`;

//   // 先檢查新 name 是否已被使用
//   if (newName) {
//     db.query(
//       "SELECT id FROM users WHERE name = ?",
//       [newName],
//       (err, results) => {
//         if (err) {
//           console.error("資料庫錯誤:", err);
//           return res.status(500).json({ message: "伺服器錯誤" });
//         }

//         if (results.length > 0) {
//           return res.status(400).json({ message: "這個名稱已被使用" });
//         }

//         // 執行更新
//         db.query(sql, values, (err, result) => {
//           if (err) {
//             console.error("更新使用者資料失敗:", err);
//             return res.status(500).json({ message: "伺服器錯誤" });
//           }

//           if (result.affectedRows === 0) {
//             return res.status(404).json({ message: "使用者不存在" });
//           }

//           res.status(200).json({ message: "使用者資料更新成功", newName });
//         });
//       }
//     );
//   } else {
//     // 如果沒有要改 name，直接更新 fileUrl 和 intro
//     db.query(sql, values, (err, result) => {
//       if (err) {
//         console.error("更新使用者資料失敗:", err);
//         return res.status(500).json({ message: "伺服器錯誤" });
//       }

//       if (result.affectedRows === 0) {
//         return res.status(404).json({ message: "使用者不存在" });
//       }

//       res.status(200).json({ message: "使用者資料更新成功" });
//     });
//   }
// };

const db = require("../config/db");

exports.updateUserProfile = (req, res) => {
  const { name } = req.params;
  const { name: newName, intro, fileUrl } = req.body;

  if (!fileUrl && !intro && !newName) {
    return res.status(400).json({ message: "請提供要更新的資料" });
  }

  // 先檢查舊名稱是否存在
  db.query("SELECT * FROM users WHERE name = ?", [name], (err, results) => {
    if (err) {
      console.error("資料庫錯誤:", err);
      return res.status(500).json({ message: "伺服器錯誤" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "使用者不存在" });
    }

    // 如果要修改 newName，先檢查是否已存在
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

          // 執行更新
          return updateUser(res, name, newName, intro, fileUrl);
        }
      );
    } else {
      // 沒有要修改 newName，直接更新
      return updateUser(res, name, null, intro, fileUrl);
    }
  });
};

// 更新使用者資料
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

  //   動態組合 SQL SET 的部分，根據使用者提供的資料靈活生成不同的 SQL 更新語法
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
