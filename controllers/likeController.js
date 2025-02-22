const db = require("../config/db");

exports.likeItem = (req, res) => {
  const { userId } = req.params;
  const { targetType, targetId } = req.body;

  if (!["post", "reply"].includes(targetType)) {
    return res.status(400).json({ error: "无效的目标类型" });
  }

  const checkTargetQuery =
    targetType === "post"
      ? "SELECT id FROM posts WHERE id = ?"
      : "SELECT id FROM replies WHERE id = ?";
  db.query(checkTargetQuery, [targetId], (err, result) => {
    if (err) return res.status(500).json({ error: "数据库错误" });
    if (result.length === 0)
      return res
        .status(404)
        .json({ error: `${targetType === "post" ? "帖子" : "评论"}不存在` });

    const checkLikeQuery =
      "SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?";
    db.query(checkLikeQuery, [userId, targetType, targetId], (err, result) => {
      if (err) return res.status(500).json({ error: "数据库错误" });

      const countLikesQuery =
        "SELECT COUNT(*) as count FROM likes WHERE target_type = ? AND target_id = ?";
      if (result.length > 0) {
        const deleteLikeQuery =
          "DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?";
        db.query(deleteLikeQuery, [userId, targetType, targetId], (err) => {
          if (err) return res.status(500).json({ error: "数据库错误" });
          db.query(
            countLikesQuery,
            [targetType, targetId],
            (err, countResult) => {
              if (err) return res.status(500).json({ error: "数据库错误" });
              res.status(200).json({
                message: "取消点赞成功",
                action: "unliked",
                likesCount: countResult[0].count,
              });
            }
          );
        });
      } else {
        const insertLikeQuery =
          "INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)";
        db.query(insertLikeQuery, [userId, targetType, targetId], (err) => {
          if (err) return res.status(500).json({ error: "数据库错误" });
          db.query(
            countLikesQuery,
            [targetType, targetId],
            (err, countResult) => {
              if (err) return res.status(500).json({ error: "数据库错误" });
              res.status(200).json({
                message: "点赞成功",
                action: "liked",
                likesCount: countResult[0].count, //
              });
            }
          );
        });
      }
    });
  });
};
