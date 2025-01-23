const db = require("../config/db");

exports.createReply = (req, res) => {
  const { postId, userId } = req.params; // 從路由參數中獲取 postId 和 userId
  const { content } = req.body;

  // 檢查回覆內容
  if (!content) {
    return res.status(400).json({ error: "回覆內容為必填" });
  }

  // 實際操作：插入回覆資料進入資料庫
  const query =
    "INSERT INTO replies (post_id, user_id, content) VALUES (?, ?, ?)";
  db.query(query, [postId, userId, content], (err, result) => {
    if (err) {
      console.error("資料庫錯誤 - 創建回覆: ", err);
      return res.status(500).json({ error: "資料庫錯誤", details: err });
    }
    res.status(201).json({ message: "回覆新增成功", replyId: result.insertId });
  });
};

// 獲取所有回覆
exports.getAllReplies = (req, res) => {
  // const query = "SELECT * FROM replies ORDER BY created_at DESC";
  const query = `
    SELECT replies.id,replies.post_id,replies.content, replies.user_id,replies.created_at, replies.updated_at, users.name AS replies_name
    FROM replies
    JOIN users ON replies.user_id = users.id
    ORDER BY replies.updated_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "資料庫錯誤" });
    }
    res.status(200).json(results);
  });
};

// 獲取指定帖子的回覆
exports.getRepliesByPost = (req, res) => {
  const { postId } = req.params;
  // const query =
  //   "SELECT * FROM replies WHERE post_id = ? ORDER BY created_at DESC";
  const query = `
    SELECT replies.id,replies.post_id,replies.content, replies.user_id,replies.created_at, replies.updated_at, users.name AS replies_name
    FROM replies
    JOIN users ON replies.user_id = users.id
    WHERE replies.post_id = ?
    ORDER BY replies.updated_at DESC
  `;

  db.query(query, [postId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "資料庫錯誤" });
    }
    res.status(200).json(results);
  });
};

// 修改回覆
exports.updateReply = (req, res) => {
  const { replyId, userId } = req.params; // 從 URL 取得回覆 ID 和用戶 ID
  const { content } = req.body; // 從請求體中取得新的內容
  const { role } = req.query; // 從查詢參數中取得角色

  // 檢查必填欄位
  if (!content) {
    return res.status(400).json({ error: "缺少必填欄位" });
  }

  // 管理員可以修改任何回覆
  if (role === "admin") {
    const query = "UPDATE replies SET content = ? WHERE id = ?";
    db.query(query, [content, replyId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "回覆不存在" });
      }
      res.status(200).json({ message: "回覆已更新" });
    });
  } else {
    // 普通用戶只能修改自己創建的回覆
    const checkQuery = "SELECT * FROM replies WHERE id = ? AND user_id = ?";
    db.query(checkQuery, [replyId, userId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.length === 0) {
        return res.status(400).json({ error: "您無權修改該回覆" });
      }

      const updateQuery = "UPDATE replies SET content = ? WHERE id = ?";
      db.query(updateQuery, [content, replyId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: "資料庫錯誤" });
        }
        res.status(200).json({ message: "回覆已更新" });
      });
    });
  }
};

// 刪除回覆
exports.deleteReply = (req, res) => {
  const { replyId, userId } = req.params; // 從 URL 取得回覆 ID 和用戶 ID
  const { role } = req.query; // 從查詢參數中取得角色

  // 管理員可以刪除任何回覆
  if (role === "admin") {
    const query = "DELETE FROM replies WHERE id = ?";
    db.query(query, [replyId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "回覆不存在" });
      }
      res.status(200).json({ message: "回覆已刪除" });
    });
  } else {
    // 普通用戶只能刪除自己創建的回覆
    const checkQuery = "SELECT * FROM replies WHERE id = ? AND user_id = ?";
    db.query(checkQuery, [replyId, userId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.length === 0) {
        return res.status(400).json({ error: "您無權刪除該回覆" });
      }

      const deleteQuery = "DELETE FROM replies WHERE id = ?";
      db.query(deleteQuery, [replyId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: "資料庫錯誤" });
        }
        res.status(200).json({ message: "回覆已刪除" });
      });
    });
  }
};
