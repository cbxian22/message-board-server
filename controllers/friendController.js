// controllers/friendController.js
const db = require("../config/db");

exports.sendFriendRequest = (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.userId;

  db.query("SELECT * FROM users WHERE id = ?", [friendId], (err, results) => {
    if (err) return res.status(500).json({ message: "伺服器錯誤" });
    if (results.length === 0)
      return res.status(404).json({ message: "用戶不存在" });

    db.query(
      "SELECT * FROM friends WHERE user_id = ? AND friend_id = ?",
      [userId, friendId],
      (err, existing) => {
        if (err) return res.status(500).json({ message: "伺服器錯誤" });
        if (existing.length > 0)
          return res.status(400).json({ message: "已存在好友請求或關係" });

        db.query(
          "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')",
          [userId, friendId],
          (err, result) => {
            if (err) return res.status(500).json({ message: "伺服器錯誤" });
            const requestId = result.insertId;

            // 插入通知
            db.query(
              "INSERT INTO notifications (user_id, type, related_id) VALUES (?, 'friend_request', ?)",
              [friendId, requestId],
              (err) => {
                if (err) return res.status(500).json({ message: "伺服器錯誤" });
                res.status(201).json({ message: "好友請求已發送", requestId });
              }
            );
          }
        );
      }
    );
  });
};

exports.acceptFriendRequest = (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.userId;

  db.query(
    "SELECT * FROM friends WHERE id = ?",
    [requestId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "伺服器錯誤" });
      if (results.length === 0)
        return res.status(404).json({ message: "好友請求不存在" });
      if (results[0].friend_id !== userId)
        return res.status(403).json({ message: "無權限接受此請求" });

      db.query(
        "UPDATE friends SET status = 'accepted' WHERE id = ?",
        [requestId],
        (err) => {
          if (err) return res.status(500).json({ message: "伺服器錯誤" });
          db.query(
            "UPDATE notifications SET is_read = 1 WHERE related_id = ? AND type = 'friend_request'",
            [requestId],
            (err) => {
              if (err) return res.status(500).json({ message: "伺服器錯誤" });
              res.status(200).json({ message: "已接受好友請求" });
            }
          );
        }
      );
    }
  );
};

exports.rejectFriendRequest = (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.userId;

  db.query(
    "SELECT * FROM friends WHERE id = ?",
    [requestId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "伺服器錯誤" });
      if (results.length === 0)
        return res.status(404).json({ message: "好友請求不存在" });
      if (results[0].friend_id !== userId)
        return res.status(403).json({ message: "無權限拒絕此請求" });

      // 直接刪除好友請求記錄
      db.query("DELETE FROM friends WHERE id = ?", [requestId], (err) => {
        if (err) return res.status(500).json({ message: "伺服器錯誤" });
        db.query(
          "UPDATE notifications SET is_read = 1 WHERE related_id = ? AND type = 'friend_request'",
          [requestId],
          (err) => {
            if (err) return res.status(500).json({ message: "伺服器錯誤" });
            res.status(200).json({ message: "已拒絕好友請求" });
          }
        );
      });
    }
  );
};

exports.deleteFriend = (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.userId;

  db.query(
    "SELECT * FROM friends WHERE status = 'accepted' AND ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))",
    [userId, friendId, friendId, userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "伺服器錯誤" });
      if (results.length === 0)
        return res.status(404).json({ message: "好友關係不存在" });

      db.query("DELETE FROM friends WHERE id = ?", [results[0].id], (err) => {
        if (err) return res.status(500).json({ message: "伺服器錯誤" });
        res.status(200).json({ message: "已刪除好友" });
      });
    }
  );
};

exports.getFriends = (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT u.id, u.name, u.account, u.intro, u.avatar_url
    FROM users u
    JOIN friends f ON (u.id = f.friend_id AND f.user_id = ?) OR (u.id = f.user_id AND f.friend_id = ?)
    WHERE f.status = 'accepted'
  `;
  db.query(query, [userId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "伺服器錯誤" });
    res.status(200).json(results);
  });
};
