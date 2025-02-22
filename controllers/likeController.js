const db = require("../config/db");

exports.likeItem = (req, res) => {
  const { userId } = req.params; // 點贊的用戶 ID
  const { targetType, targetId } = req.body; // 目標類型（post 或 reply）和目標 ID

  // 驗證 targetType
  if (!["post", "reply"].includes(targetType)) {
    return res.status(400).json({ error: "无效的目标类型" });
  }

  // 檢查目標是否存在
  const checkTargetQuery =
    targetType === "post"
      ? "SELECT id FROM posts WHERE id = ?"
      : "SELECT id FROM replies WHERE id = ?";
  db.query(checkTargetQuery, [targetId], (err, result) => {
    if (err) {
      console.error("检查目标失败:", err);
      return res.status(500).json({ error: "数据库错误" });
    }
    if (result.length === 0) {
      return res
        .status(404)
        .json({ error: `${targetType === "post" ? "帖子" : "评论"}不存在` });
    }

    // 檢查是否已點贊
    const checkLikeQuery =
      "SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?";
    db.query(checkLikeQuery, [userId, targetType, targetId], (err, result) => {
      if (err) {
        console.error("检查点赞失败:", err);
        return res.status(500).json({ error: "数据库错误" });
      }
      if (result.length > 0) {
        return res.status(400).json({ error: "您已点赞" });
      }

      // 插入點贊記錄
      const insertLikeQuery =
        "INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)";
      db.query(insertLikeQuery, [userId, targetType, targetId], (err) => {
        if (err) {
          console.error("添加点赞失败:", err);
          return res.status(500).json({ error: "数据库错误" });
        }
        res.status(200).json({ message: "点赞成功" });
      });
    });
  });
};

exports.unlikeItem = (req, res) => {
  const { userId } = req.params; // 取消點贊的用戶 ID
  const { targetType, targetId } = req.body; // 目標類型和 ID

  // 驗證 targetType
  if (!["post", "reply"].includes(targetType)) {
    return res.status(400).json({ error: "无效的目标类型" });
  }

  // 刪除點贊記錄
  const deleteLikeQuery =
    "DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?";
  db.query(deleteLikeQuery, [userId, targetType, targetId], (err, result) => {
    if (err) {
      console.error("取消点赞失败:", err);
      return res.status(500).json({ error: "数据库错误" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "未找到点赞记录" });
    }
    res.status(200).json({ message: "取消点赞成功" });
  });
};
