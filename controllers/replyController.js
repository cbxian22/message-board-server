// const db = require("../config/db");

// exports.createReply = (req, res) => {
//   const { postId, userId } = req.params;
//   const { content } = req.body;

//   // 檢查回覆內容
//   if (!content) {
//     return res.status(400).json({ error: "回覆內容為必填" });
//   }

//   const query =
//     "INSERT INTO replies (post_id, user_id, content) VALUES (?, ?, ?)";
//   db.query(query, [postId, userId, content], (err, result) => {
//     if (err) {
//       console.error("資料庫錯誤 - 創建回覆: ", err);
//       return res.status(500).json({ error: "資料庫錯誤", details: err });
//     }
//     res.status(201).json({ message: "回覆新增成功", replyId: result.insertId });
//   });
// };

// // 獲取所有回覆
// exports.getAllReplies = (req, res) => {
//   const query = `
//     SELECT replies.id,replies.post_id,replies.content, replies.user_id,replies.created_at, replies.updated_at, users.name AS replies_name
//     FROM replies
//     JOIN users ON replies.user_id = users.id
//     ORDER BY replies.updated_at DESC
//   `;

//   db.query(query, (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: "資料庫錯誤" });
//     }
//     res.status(200).json(results);
//   });
// };

// // 獲取指定帖子的回覆
// exports.getRepliesByPost = (req, res) => {
//   const { postId } = req.params;
//   const query = `
//     SELECT replies.id,replies.post_id,replies.content, replies.user_id,replies.created_at, replies.updated_at, users.name AS replies_name
//     FROM replies
//     JOIN users ON replies.user_id = users.id
//     WHERE replies.post_id = ?
//     ORDER BY replies.updated_at DESC
//   `;

//   db.query(query, [postId], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: "資料庫錯誤" });
//     }
//     res.status(200).json(results);
//   });
// };

// // 修改回覆
// exports.updateReply = (req, res) => {
//   const { replyId, userId } = req.params;
//   const { role } = req.query;

//   // 檢查必填欄位
//   if (!content) {
//     return res.status(400).json({ error: "缺少必填欄位" });
//   }

//   if (role === "admin") {
//     const query = "UPDATE replies SET content = ? WHERE id = ?";
//     db.query(query, [content, replyId], (err, result) => {
//       if (err) {
//         return res.status(500).json({ error: "資料庫錯誤" });
//       }
//       if (result.affectedRows === 0) {
//         return res.status(404).json({ error: "回覆不存在" });
//       }
//       res.status(200).json({ message: "回覆已更新" });
//     });
//   } else {
//     const checkQuery = "SELECT * FROM replies WHERE id = ? AND user_id = ?";
//     db.query(checkQuery, [replyId, userId], (err, result) => {
//       if (err) {
//         return res.status(500).json({ error: "資料庫錯誤" });
//       }
//       if (result.length === 0) {
//         return res.status(400).json({ error: "您無權修改該回覆" });
//       }

//       const updateQuery = "UPDATE replies SET content = ? WHERE id = ?";
//       db.query(updateQuery, [content, replyId], (err, result) => {
//         if (err) {
//           return res.status(500).json({ error: "資料庫錯誤" });
//         }
//         res.status(200).json({ message: "回覆已更新" });
//       });
//     });
//   }
// };

// // 刪除回覆
// exports.deleteReply = (req, res) => {
//   const { replyId, userId } = req.params;
//   const { role } = req.query;

//   if (role === "admin") {
//     const query = "DELETE FROM replies WHERE id = ?";
//     db.query(query, [replyId], (err, result) => {
//       if (err) {
//         return res.status(500).json({ error: "資料庫錯誤" });
//       }
//       if (result.affectedRows === 0) {
//         return res.status(404).json({ error: "回覆不存在" });
//       }
//       res.status(200).json({ message: "回覆已刪除" });
//     });
//   } else {
//     const checkQuery = "SELECT * FROM replies WHERE id = ? AND user_id = ?";
//     db.query(checkQuery, [replyId, userId], (err, result) => {
//       if (err) {
//         return res.status(500).json({ error: "資料庫錯誤" });
//       }
//       if (result.length === 0) {
//         return res.status(400).json({ error: "您無權刪除該回覆" });
//       }

//       const deleteQuery = "DELETE FROM replies WHERE id = ?";
//       db.query(deleteQuery, [replyId], (err, result) => {
//         if (err) {
//           return res.status(500).json({ error: "資料庫錯誤" });
//         }
//         res.status(200).json({ message: "回覆已刪除" });
//       });
//     });
//   }
// };
// controllers/replyController.js
const db = require("../config/db");

exports.createReply = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "請先登入以創建回覆" });
  }

  const { postId } = req.params;
  const userId = req.user.userId; // 從 token 獲取
  const { content } = req.body;
  const fileUrl = req.body.file_url || null;

  if (!content && !fileUrl) {
    return res.status(400).json({ error: "回覆內容和檔案URL不能同時為空" });
  }

  const query =
    "INSERT INTO replies (post_id, user_id, content, file_url) VALUES (?, ?, ?, ?)";
  db.query(query, [postId, userId, content, fileUrl], (err, result) => {
    if (err) {
      console.error("資料庫錯誤 - 創建回覆: ", err);
      return res.status(500).json({ error: "資料庫錯誤", details: err });
    }
    res.status(201).json({ message: "回覆新增成功", replyId: result.insertId });
  });
};

exports.getAllReplies = (req, res) => {
  const userId = req.user ? req.user.userId : null; // 未登入時為 null

  const query = `
    SELECT 
      r.id, r.post_id, r.content, r.user_id, 
      r.created_at, r.updated_at, r.file_url,
      u.name AS replies_name,
      u.avatar_url AS user_avatar,
      (SELECT COUNT(*) FROM likes WHERE target_type = 'reply' AND target_id = r.id) AS likes,
      EXISTS(SELECT 1 FROM likes WHERE target_type = 'reply' AND target_id = r.id AND user_id = ?) AS user_liked
    FROM replies r
    JOIN users u ON r.user_id = u.id
    GROUP BY r.id
    ORDER BY r.updated_at DESC
  `;

  db.query(query, [userId || null], (err, results) => {
    if (err) {
      console.error("資料庫錯誤 - 獲取所有回覆: ", err);
      return res.status(500).json({ error: "資料庫錯誤" });
    }
    res.status(200).json(results);
  });
};

exports.getRepliesByPost = (req, res) => {
  const { postId } = req.params;
  const userId = req.user ? req.user.userId : null; // 未登入時為 null

  const query = `
    SELECT 
      r.id, r.post_id, r.content, r.user_id, 
      r.created_at, r.updated_at, r.file_url,
      u.name AS replies_name,
      u.avatar_url AS user_avatar,
      (SELECT COUNT(*) FROM likes WHERE target_type = 'reply' AND target_id = r.id) AS likes,
      EXISTS(SELECT 1 FROM likes WHERE target_type = 'reply' AND target_id = r.id AND user_id = ?) AS user_liked
    FROM replies r
    JOIN users u ON r.user_id = u.id
    WHERE r.post_id = ?
    GROUP BY r.id
    ORDER BY r.updated_at DESC
  `;

  db.query(query, [userId || null, postId], (err, results) => {
    if (err) {
      console.error("資料庫錯誤 - 獲取貼文回覆: ", err);
      return res.status(500).json({ error: "資料庫錯誤" });
    }
    res.status(200).json(results);
  });
};

exports.updateReply = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "請先登入以修改回覆" });
  }

  const { replyId } = req.params;
  const userId = req.user.userId; // 從 token 獲取
  const { role } = req.query;
  const { content, file_url } = req.body;

  if (!content && !file_url) {
    return res.status(400).json({ error: "回覆內容和檔案URL不能同時為空" });
  }

  if (role === "admin") {
    const query = "UPDATE replies SET content = ?, file_url = ? WHERE id = ?";
    db.query(query, [content, file_url, replyId], (err, result) => {
      if (err) {
        console.error("資料庫錯誤 - 修改回覆: ", err);
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "回覆不存在" });
      }
      res.status(200).json({ message: "回覆已更新" });
    });
  } else {
    const checkQuery = "SELECT * FROM replies WHERE id = ? AND user_id = ?";
    db.query(checkQuery, [replyId, userId], (err, result) => {
      if (err) {
        console.error("資料庫錯誤 - 檢查回覆權限: ", err);
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.length === 0) {
        return res.status(403).json({ error: "您無權修改該回覆" });
      }

      const updateQuery =
        "UPDATE replies SET content = ?, file_url = ? WHERE id = ?";
      db.query(updateQuery, [content, file_url, replyId], (err, result) => {
        if (err) {
          console.error("資料庫錯誤 - 更新回覆: ", err);
          return res.status(500).json({ error: "資料庫錯誤" });
        }
        res.status(200).json({ message: "回覆已更新" });
      });
    });
  }
};

exports.deleteReply = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "請先登入以刪除回覆" });
  }

  const { replyId } = req.params;
  const userId = req.user.userId; // 從 token 獲取
  const { role } = req.query;

  if (role === "admin") {
    const query = "DELETE FROM replies WHERE id = ?";
    db.query(query, [replyId], (err, result) => {
      if (err) {
        console.error("資料庫錯誤 - 刪除回覆: ", err);
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "回覆不存在" });
      }
      res.status(200).json({ message: "回覆已刪除" });
    });
  } else {
    const checkQuery = "SELECT * FROM replies WHERE id = ? AND user_id = ?";
    db.query(checkQuery, [replyId, userId], (err, result) => {
      if (err) {
        console.error("資料庫錯誤 - 檢查回覆權限: ", err);
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.length === 0) {
        return res.status(403).json({ error: "您無權刪除該回覆" });
      }

      const deleteQuery = "DELETE FROM replies WHERE id = ?";
      db.query(deleteQuery, [replyId], (err, result) => {
        if (err) {
          console.error("資料庫錯誤 - 刪除回覆: ", err);
          return res.status(500).json({ error: "資料庫錯誤" });
        }
        res.status(200).json({ message: "回覆已刪除" });
      });
    });
  }
};

module.exports = exports;
