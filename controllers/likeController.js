// likeController.js
const db = require("../config/db");

exports.likeItem = async (req, res) => {
  const { userId } = req.params;
  const { targetType, targetId } = req.body;

  if (!["post", "reply"].includes(targetType)) {
    return res.status(400).json({ error: "無效的目標類型" });
  }

  let connection;
  try {
    // 開始事務
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // 檢查用戶是否存在
    const [userCheck] = await connection.query(
      "SELECT 1 FROM users WHERE id = ?",
      [userId]
    );
    if (!userCheck.length) {
      throw new Error("用戶不存在");
    }

    // 檢查目標是否存在
    const targetTable = targetType === "post" ? "posts" : "replies";
    const [targetCheck] = await connection.query(
      `SELECT 1 FROM ${targetTable} WHERE id = ?`,
      [targetId]
    );
    if (!targetCheck.length) {
      throw new Error(`${targetType === "post" ? "帖子" : "評論"}不存在`);
    }

    // 檢查點讚狀態（不直接鎖定整個表）
    const checkQuery = `
      SELECT 
        EXISTS(SELECT 1 FROM ${targetTable} WHERE id = ?) AS target_exists,
        EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?) AS has_liked,
        (SELECT COUNT(*) FROM likes WHERE target_type = ? AND target_id = ?) AS likes_count
    `;
    const [checkResult] = await connection.query(checkQuery, [
      targetId,
      userId,
      targetType,
      targetId,
      targetType,
      targetId,
    ]);

    console.log("checkQuery result:", JSON.stringify(checkResult[0]));

    if (!checkResult[0].target_exists) {
      throw new Error(`${targetType === "post" ? "帖子" : "評論"}不存在`);
    }

    const rawHasLiked = checkResult[0].has_liked;
    const hasLiked = Number(rawHasLiked) === 1;
    console.log("rawHasLiked:", rawHasLiked, "computed hasLiked:", hasLiked);

    let newLikesCount = checkResult[0].likes_count;

    if (hasLiked) {
      console.log("執行取消點讚");
      // 鎖定並刪除記錄
      await connection.query(
        "SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ? FOR UPDATE",
        [userId, targetType, targetId]
      );
      const deleteQuery =
        "DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?";
      await connection.query(deleteQuery, [userId, targetType, targetId]);
      newLikesCount -= 1;
      await connection.commit();
      return res.status(200).json({
        message: "取消點讚成功",
        action: "unliked",
        likesCount: newLikesCount,
      });
    } else {
      console.log("執行點讚");
      // 鎖定並插入記錄
      await connection.query(
        "SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ? FOR UPDATE",
        [userId, targetType, targetId]
      );
      const insertQuery =
        "INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)";
      await connection.query(insertQuery, [userId, targetType, targetId]);
      newLikesCount += 1;
      await connection.commit();
      return res.status(200).json({
        message: "點讚成功",
        action: "liked",
        likesCount: newLikesCount,
      });
    }
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("處理點讚失敗:", err.stack);
    return res.status(500).json({ error: "伺服器錯誤", details: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
