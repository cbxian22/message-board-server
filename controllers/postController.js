const db = require("../config/db");

// 创建新帖子
exports.createPost = (req, res) => {
  const { userId } = req.params;
  const { content, fileUrl, visibility } = req.body;

  const validVisibilities = ["public", "friends", "private"];
  const postVisibility = validVisibilities.includes(visibility)
    ? visibility
    : "public";

  const query =
    "INSERT INTO posts (content, user_id, file_url, visibility) VALUES (?, ?, ?, ?)";
  db.query(
    query,
    [content, userId, fileUrl || null, postVisibility],
    (err, result) => {
      if (err) {
        console.error("数据库错误 - 插入帖子: ", err);
        return res.status(500).json({ error: "数据库错误", details: err });
      }
      res.status(201).json({ success: true, postId: result.insertId });
    }
  );
};

// 获取所有帖子
exports.getAllPosts = (req, res) => {
  const userId = req.user ? req.user.userId : null;

  let query;
  let params;

  if (userId) {
    console.log("登入用戶，主頁查詢，userId:", userId);
    query = `
      SELECT 
        p.id, 
        p.content, 
        p.user_id, 
        p.created_at, 
        p.updated_at, 
        p.file_url, 
        p.visibility,
        u.name AS user_name, 
        u.avatar_url AS user_avatar,
        u.is_private,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
        EXISTS(SELECT 1 FROM likes WHERE target_type = 'post' AND target_id = p.id AND user_id = ?) AS user_liked,
        (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE 
        -- 未設私人的公開貼文（所有人可見）
        (p.visibility = 'public' AND u.is_private = 0)
        -- 自己的 public 和 friends 貼文（排除 private）
        OR (p.user_id = ? AND p.visibility IN ('public', 'friends'))
        -- 好友的 public 和 friends 貼文（包括 private = true 的用戶）
        OR (p.visibility IN ('public', 'friends') AND EXISTS (
          SELECT 1 FROM friends 
          WHERE status = 'accepted'
          AND (
            (user_id = ? AND friend_id = p.user_id)
            OR (friend_id = ? AND user_id = p.user_id)
          )
        ))
      ORDER BY p.updated_at DESC
    `;
    params = [userId, userId, userId, userId];
  } else {
    console.log("未登入用戶，主頁查詢");
    query = `
      SELECT 
        p.id, 
        p.content, 
        p.user_id, 
        p.created_at, 
        p.updated_at, 
        p.file_url, 
        p.visibility,
        u.name AS user_name, 
        u.avatar_url AS user_avatar,
        u.is_private,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
        0 AS user_liked,
        (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.visibility = 'public' AND u.is_private = 0
      ORDER BY p.updated_at DESC
    `;
    params = [];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("數據庫錯誤 - 獲取所有貼文: ", err);
      return res.status(500).json({ message: "伺服器錯誤", details: err });
    }
    console.log("主頁返回的貼文數量:", results.length);
    console.log("主頁返回的貼文:", results);
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

// // 获取指定用户名的所有帖子
exports.getPostsByUsername = (req, res) => {
  const { name } = req.params;
  const userId = req.user ? req.user.userId : null;

  let query;
  let params;

  if (userId) {
    console.log("登入用戶，個人頁面查詢，userId:", userId, "name:", name);
    query = `
      SELECT 
        p.id, 
        p.content, 
        p.user_id, 
        p.created_at, 
        p.updated_at, 
        p.file_url, 
        p.visibility,
        u.name AS user_name, 
        u.avatar_url AS user_avatar,
        u.is_private,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
        EXISTS(SELECT 1 FROM likes WHERE target_type = 'post' AND target_id = p.id AND user_id = ?) AS user_liked,
        (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies,
        EXISTS(SELECT 1 FROM friends WHERE status = 'accepted' AND (
          (user_id = ? AND friend_id = p.user_id) OR (friend_id = ? AND user_id = p.user_id)
        )) AS is_friend
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE u.name = ?
      AND (
        (p.visibility = 'public' AND u.is_private = 0)
        OR p.user_id = ?
        OR (p.visibility IN ('public', 'friends') AND EXISTS (
          SELECT 1 FROM friends 
          WHERE status = 'accepted'
          AND (
            (user_id = ? AND friend_id = p.user_id)
            OR (friend_id = ? AND user_id = p.user_id)
          )
        ))
      )
      ORDER BY p.updated_at DESC
    `;
    params = [userId, userId, userId, name, userId, userId, userId];
  } else {
    console.log("未登入用戶，個人頁面查詢，name:", name);
    query = `
      SELECT 
        p.id, 
        p.content, 
        p.user_id, 
        p.created_at, 
        p.updated_at, 
        p.file_url, 
        p.visibility,
        u.name AS user_name, 
        u.avatar_url AS user_avatar,
        u.is_private,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
        0 AS user_liked,
        (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE u.name = ?
      AND p.visibility = 'public' AND u.is_private = 0
      ORDER BY p.updated_at DESC
    `;
    params = [name];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("數據庫錯誤 - 獲取指定用戶貼文: ", err);
      return res.status(500).json({ message: "伺服器錯誤", details: err });
    }
    res.status(200).json(results);
  });
};

// 新增好友頁：GET /api/friends/posts
exports.getFriendsPosts = (req, res) => {
  const userId = req.user ? req.user.userId : null;

  if (!userId) {
    return res.status(401).json({ message: "請先登入以查看好友貼文" });
  }

  const query = `
    SELECT 
      p.id, 
      p.content, 
      p.user_id, 
      p.created_at, 
      p.updated_at, 
      p.file_url, 
      p.visibility,
      u.name AS user_name, 
      u.avatar_url AS user_avatar,
      u.is_private,
      (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
      EXISTS(SELECT 1 FROM likes WHERE target_type = 'post' AND target_id = p.id AND user_id = ?) AS user_liked,
      (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE 
      (p.visibility = 'public' OR p.visibility = 'friends')
      AND EXISTS (
        SELECT 1 FROM friends 
        WHERE status = 'accepted'
        AND (
          (user_id = ? AND friend_id = p.user_id)
          OR (friend_id = ? AND user_id = p.user_id)
        )
      )
    ORDER BY p.updated_at DESC
  `;
  const params = [userId, userId, userId];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("数据库错误 - 获取好友帖子: ", err);
      return res.status(500).json({ message: "服务器错误", details: err });
    }
    res.status(200).json(results);
  });
};

// 修改帖子 調整 updatePost，支援 visibility
exports.updatePost = (req, res) => {
  const { postId, userId } = req.params;
  const { content, fileUrl, visibility } = req.body;
  const { role } = req.query;

  if (!content && !fileUrl && !visibility) {
    return res.status(400).json({ error: "請提供內容、圖片或可見性" });
  }

  const validVisibilities = ["public", "friends", "private"];
  const postVisibility = validVisibilities.includes(visibility)
    ? visibility
    : null;

  if (role === "admin") {
    const query =
      "UPDATE posts SET content = ?, file_url = ?, visibility = COALESCE(?, visibility) WHERE id = ?";
    db.query(
      query,
      [content || null, fileUrl || null, postVisibility, postId],
      (err, result) => {
        if (err) return res.status(500).json({ error: "資料庫錯誤" });
        if (result.affectedRows === 0)
          return res.status(404).json({ error: "貼文不存在" });
        res.status(200).json({ message: "貼文已更新" });
      }
    );
  } else {
    const checkQuery = "SELECT * FROM posts WHERE id = ? AND user_id = ?";
    db.query(checkQuery, [postId, userId], (err, result) => {
      if (err) return res.status(500).json({ error: "資料庫錯誤" });
      if (result.length === 0)
        return res.status(403).json({ error: "您無權修改該貼文" });

      const updateQuery =
        "UPDATE posts SET content = ?, file_url = ?, visibility = COALESCE(?, visibility) WHERE id = ?";
      db.query(
        updateQuery,
        [content || null, fileUrl || null, postVisibility, postId],
        (err, result) => {
          if (err) return res.status(500).json({ error: "資料庫錯誤" });
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
