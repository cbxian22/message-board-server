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
        u.accountname AS user_name, 
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
        u.accountname AS user_name, 
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
  const userId = req.user ? req.user.userId : null;

  // 驗證 postId
  if (!postId || isNaN(postId)) {
    return res.status(400).json({ error: "無效的貼文 ID" });
  }

  console.log("請求的 postId:", postId, "userId:", userId);

  const query = `
    SELECT 
      p.id, 
      p.content, 
      p.user_id, 
      p.created_at, 
      p.updated_at, 
      p.file_url,
      p.visibility,
      u.accountname AS user_name, 
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
    WHERE p.id = ?
  `;

  db.query(query, [userId, userId, userId, postId], (err, result) => {
    if (err) {
      console.error("資料庫錯誤 - 獲取單一貼文: ", err);
      return res.status(500).json({ error: "伺服器內部錯誤" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "帖子未找到" });
    }

    const post = result[0];
    console.log("貼文資料:", post);

    // 未登入用戶：只能看公開且非私人帳戶的貼文
    if (!userId) {
      if (post.visibility !== "public" || post.is_private) {
        return res.status(403).json({ error: "無權查看此貼文" });
      }
      return res.status(200).json(post);
    }

    // 已登入用戶權限檢查
    if (post.user_id === parseInt(userId)) {
      // 作者本人可以看到所有自己的貼文
      return res.status(200).json(post);
    }

    // 其他用戶的貼文權限檢查
    if (post.visibility === "private") {
      return res.status(403).json({ error: "無權查看此私人貼文" });
    }

    if (post.visibility === "friends") {
      if (!post.is_friend) {
        return res.status(403).json({ error: "無權查看此好友貼文" });
      }
      return res.status(200).json(post);
    }

    if (post.visibility === "public") {
      if (post.is_private) {
        // 公開貼文但帳戶設為私人，需檢查好友關係
        if (!post.is_friend) {
          return res.status(403).json({ error: "無權查看此貼文" });
        }
      }
      return res.status(200).json(post);
    }

    // 其他未預期的情況
    return res.status(403).json({ error: "無權查看此貼文" });
  });
};

// // 获取指定用户名的所有帖子
exports.getPostsByAccountname = (req, res) => {
  const { accountname } = req.params;
  const userId = req.user ? req.user.userId : null;

  let query;
  let params;

  if (userId) {
    console.log(
      "登入用戶，個人頁面查詢，userId:",
      userId,
      "accountname:",
      accountname
    );
    query = `
      SELECT 
        p.id, 
        p.content, 
        p.user_id, 
        p.created_at, 
        p.updated_at, 
        p.file_url, 
        p.visibility,
        u.accountname AS user_name, 
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
      WHERE u.accountname = ?
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
    params = [userId, userId, userId, accountname, userId, userId, userId];
  } else {
    console.log("未登入用戶，個人頁面查詢，accountname:", accountname);
    query = `
      SELECT 
        p.id, 
        p.content, 
        p.user_id, 
        p.created_at, 
        p.updated_at, 
        p.file_url, 
        p.visibility,
        u.accountname AS user_name,  
        u.avatar_url AS user_avatar,
        u.is_private,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) AS likes,
        0 AS user_liked,
        (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE u.accountname = ?
      AND p.visibility = 'public' AND u.is_private = 0
      ORDER BY p.updated_at DESC
    `;
    params = [accountname];
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
      u.accountname AS user_name, 
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
