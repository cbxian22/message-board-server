const db = require("../config/db");

// 创建新帖子
exports.createPost = (req, res) => {
  const { userId } = req.params; // 从 URL 路由参数中取得 userId
  const { content } = req.body; // 从请求体中取得标题和内容
  // const { title, content } = req.body; // 从请求体中取得标题和内容

  // 检查必填字段
  if (!content) {
    return res.status(400).json({ error: "缺少必填字段" });
  }

  // 插入帖子
  const query = "INSERT INTO posts ( content, user_id) VALUES (?, ?)";
  db.query(query, [content, userId], (err, result) => {
    if (err) {
      console.error("数据库错误 - 插入帖子: ", err);
      return res.status(500).json({ error: "数据库错误", details: err });
    }

    res.status(201).json({ success: true, postId: result.insertId });
  });
};

// 获取所有帖子
exports.getAllPosts = (req, res) => {
  // const query = "SELECT * FROM posts ORDER BY updated_at DESC";
  const query = `
  SELECT posts.id, posts.content, posts.user_id, posts.created_at, posts.updated_at, posts.file_url, users.name AS user_name
  FROM posts
  JOIN users ON posts.user_id = users.id
  ORDER BY posts.updated_at DESC
`;
  db.query(query, (err, results) => {
    if (err) {
      console.error("数据库错误 - 获取所有帖子: ", err); // 打印详细错误
      return res.status(500).json({ message: "服务器错误", details: err });
    }
    res.status(200).json(results);
  });
};

// 获取单一帖子
exports.getPostById = (req, res) => {
  const { postId } = req.params;
  // const query = "SELECT * FROM posts WHERE id = ?";
  const query = `
    SELECT posts.id, posts.content, posts.user_id, posts.created_at, posts.updated_at, posts.file_url, users.name AS user_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `;

  db.query(query, [postId], (err, result) => {
    if (err || result.length === 0) {
      console.error("数据库错误或找不到帖子: ", err);
      return res.status(404).json({ error: "帖子未找到", details: err });
    }
    res.status(200).json(result[0]);
  });
};

// 获取指定用户的所有帖子
exports.getPostsByUserId = (req, res) => {
  const { userId } = req.params; // 从 URL 获取用户 ID

  const query = `
    SELECT posts.id, posts.content, posts.user_id, posts.created_at, posts.updated_at, posts.file_url, users.name AS user_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.user_id = ?
    ORDER BY posts.updated_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("数据库错误 - 获取指定用户的所有帖子: ", err); // 打印详细错误
      return res.status(500).json({ message: "服务器错误", details: err });
    }
    res.status(200).json(results);
  });
};

// 修改帖子
exports.updatePost = (req, res) => {
  const { postId, userId } = req.params; // 从 URL 获取帖子 ID 和用户 ID
  const { title, content } = req.body; // 从请求体中获取修改的内容
  const { role } = req.query; // 从查询参数中获取角色

  // 检查必填字段
  if (!content) {
    return res.status(400).json({ error: "缺少必填字段" });
  }

  // 如果是 admin，用户可修改任何帖子
  if (role === "admin") {
    const query = "UPDATE posts SET content = ? WHERE id = ?";
    db.query(query, [content, postId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "数据库错误" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "帖子不存在" });
      }

      res.status(200).json({ message: "帖子已更新" });
    });
  } else {
    // 普通用户只能修改自己创建的帖子
    const checkQuery = "SELECT * FROM posts WHERE id = ? AND user_id = ?";
    db.query(checkQuery, [postId, userId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "数据库错误" });
      }
      if (result.length === 0) {
        return res.status(400).json({ error: "您无权修改该帖子" });
      }

      const updateQuery = "UPDATE posts SET content = ? WHERE id = ?";
      db.query(updateQuery, [content, postId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: "数据库错误" });
        }
        res.status(200).json({ message: "帖子已更新" });
      });
    });
  }
};

// 删除帖子
exports.deletePost = (req, res) => {
  const { postId, userId } = req.params; // 从 URL 获取帖子的 id 和 userId
  const { role } = req.query; // 从查询参数中获取 role

  // 如果 role 是 admin，允许删除任何帖子
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
    // 普通用户只能删除自己创建的帖子
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
