const db = require("../config/db");

// 创建新帖子
exports.createPost = (req, res) => {
  const { userId } = req.params;
  const { content, fileUrl } = req.body;

  const query =
    "INSERT INTO posts (content, user_id, file_url) VALUES (?, ?, ?)";
  db.query(query, [content, userId, fileUrl || null], (err, result) => {
    if (err) {
      console.error("数据库错误 - 插入帖子: ", err);
      return res.status(500).json({ error: "数据库错误", details: err });
    }
    res.status(201).json({ success: true, postId: result.insertId });
  });
};

// 获取所有帖子
exports.getAllPosts = (req, res) => {
  const userId = req.query.userId || null; // 從查詢參數獲取當前用戶 ID

  const query = `
    SELECT 
      p.id, 
      p.content, 
      p.user_id, 
      p.created_at, 
      p.updated_at, 
      p.file_url, 
      u.name AS user_name, 
      u.avatar_url AS user_avatar,
      (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
      EXISTS(SELECT 1 FROM likes WHERE target_type = 'post' AND target_id = p.id AND user_id = ?) AS user_liked,
      (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.updated_at DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("数据库错误 - 获取所有帖子: ", err);
      return res.status(500).json({ message: "服务器错误", details: err });
    }
    res.status(200).json(results);
  });
};

// 获取单一帖子
exports.getPostById = (req, res) => {
  const { postId } = req.params;
  const userId = req.query.userId || null; // 從查詢參數獲取當前用戶 ID

  const query = `
    SELECT 
      p.id, 
      p.content, 
      p.user_id, 
      p.created_at, 
      p.updated_at, 
      p.file_url, 
      u.name AS user_name, 
      u.avatar_url AS user_avatar,
      (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
      EXISTS(SELECT 1 FROM likes WHERE target_type = 'post' AND target_id = p.id AND user_id = ?) AS user_liked,
      (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;
  db.query(query, [userId, postId], (err, result) => {
    if (err || result.length === 0) {
      console.error("数据库错误或找不到帖子: ", err);
      return res.status(404).json({ error: "帖子未找到", details: err });
    }
    res.status(200).json(result[0]);
  });
};

// 获取指定用户名的所有帖子
exports.getPostsByUsername = (req, res) => {
  const { name } = req.params;
  const userId = req.query.userId || null; // 從查詢參數獲取當前用戶 ID

  const query = `
    SELECT 
      p.id, 
      p.content, 
      p.user_id, 
      p.created_at, 
      p.updated_at, 
      p.file_url, 
      u.name AS user_name, 
      u.avatar_url AS user_avatar,
      (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
      EXISTS(SELECT 1 FROM likes WHERE target_type = 'post' AND target_id = p.id AND user_id = ?) AS user_liked,
      (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE u.name = ?
    ORDER BY p.updated_at DESC
  `;
  db.query(query, [userId, name], (err, results) => {
    if (err) {
      console.error("数据库错误 - 获取指定用户名的所有帖子: ", err);
      return res.status(500).json({ message: "服务器错误", details: err });
    }
    res.status(200).json(results);
  });
};

// 修改帖子
exports.updatePost = (req, res) => {
  const { postId, userId } = req.params;
  const { content, fileUrl } = req.body;
  const { role } = req.query;

  if (!content && !fileUrl) {
    return res
      .status(400)
      .json({ error: "請提供內容或圖片 (content 或 fileUrl 至少擇一)" });
  }

  if (role === "admin") {
    const query = "UPDATE posts SET content = ?, file_url = ? WHERE id = ?";
    db.query(
      query,
      [content || null, fileUrl || null, postId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: "資料庫錯誤" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "貼文不存在" });
        }
        res.status(200).json({ message: "貼文已更新" });
      }
    );
  } else {
    const checkQuery = "SELECT * FROM posts WHERE id = ? AND user_id = ?";
    db.query(checkQuery, [postId, userId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "資料庫錯誤" });
      }
      if (result.length === 0) {
        return res.status(403).json({ error: "您無權修改該貼文" });
      }

      const updateQuery =
        "UPDATE posts SET content = ?, file_url = ? WHERE id = ?";
      db.query(
        updateQuery,
        [content || null, fileUrl || null, postId],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: "資料庫錯誤" });
          }
          res.status(200).json({ message: "貼文已更新" });
        }
      );
    });
  }
};

// 删除帖子
exports.deletePost = (req, res) => {
  const { postId, userId } = req.params;
  const { role } = req.query;

  if (role === "admin") {
    const query = "DELETE FROM posts WHERE id = ?";
    db.query(query, [postId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "数据库错误" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "帖子不存在" });
      }
      res.status(200).json({ message: "帖子已删除" });
    });
  } else {
    const checkQuery = "SELECT * FROM posts WHERE id = ? AND user_id = ?";
    db.query(checkQuery, [postId, userId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "数据库错误" });
      }
      if (result.length === 0) {
        return res.status(400).json({ error: "您无权删除该帖子" });
      }
      const deleteQuery = "DELETE FROM posts WHERE id = ?";
      db.query(deleteQuery, [postId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: "数据库错误" });
        }
        res.status(200).json({ message: "帖子已删除" });
      });
    });
  }
};
