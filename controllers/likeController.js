// likeController.js
const db = require("../config/db");

exports.likeItem = async (req, res) => {
  const { userId } = req.params; // 從 URL 參數中獲取 userId
  const { targetType, targetId } = req.body; // 從請求主體中獲取 targetType 和 targetId

  // 驗證 targetType 是否有效
  if (!["post", "reply"].includes(targetType)) {
    return res.status(400).json({ error: "無效的目標類型" });
  }

  try {
    // 檢查用戶是否存在
    const [userCheck] = await db
      .promise()
      .query("SELECT 1 FROM users WHERE id = ?", [userId]);
    if (!userCheck.length) {
      return res.status(404).json({ error: "用戶不存在" });
    }

    // 檢查目標是否存在
    const targetTable = targetType === "post" ? "posts" : "replies";
    const [targetCheck] = await db
      .promise()
      .query(`SELECT 1 FROM ${targetTable} WHERE id = ?`, [targetId]);
    if (!targetCheck.length) {
      return res
        .status(404)
        .json({ error: `${targetType === "post" ? "帖子" : "評論"}不存在` });
    }

    // 檢查目標是否存在並獲取當前點讚狀態
    const checkQuery = `
      SELECT 
        EXISTS(SELECT 1 FROM ${targetTable} WHERE id = ?) AS target_exists,
        EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?) AS has_liked,
        (SELECT COUNT(*) FROM likes WHERE target_type = ? AND target_id = ?) AS likes_count
    `;
    const [checkResult] = await db
      .promise()
      .query(checkQuery, [
        targetId,
        userId,
        targetType,
        targetId,
        targetType,
        targetId,
      ]);

    // 這裡 target_exists 應該已經由前面的檢查保證，但保留邏輯以防萬一
    if (!checkResult[0].target_exists) {
      return res
        .status(404)
        .json({ error: `${targetType === "post" ? "帖子" : "評論"}不存在` });
    }

    const hasLiked = checkResult[0].has_liked;
    let newLikesCount = checkResult[0].likes_count;

    if (hasLiked) {
      // 取消點讚
      const deleteQuery =
        "DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?";
      await db.promise().query(deleteQuery, [userId, targetType, targetId]);
      newLikesCount -= 1; // 減少計數
      return res.status(200).json({
        message: "取消點讚成功",
        action: "unliked",
        likesCount: newLikesCount,
      });
    } else {
      // 點讚
      const insertQuery =
        "INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)";
      await db.promise().query(insertQuery, [userId, targetType, targetId]);
      newLikesCount += 1; // 增加計數
      return res.status(200).json({
        message: "點讚成功",
        action: "liked",
        likesCount: newLikesCount,
      });
    }
  } catch (err) {
    // 記錄詳細的錯誤信息，包括堆棧追蹤
    console.error("處理點讚失敗:", err.stack);
    return res.status(500).json({ error: "伺服器錯誤", details: err.message });
  }
};
