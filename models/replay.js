const db = require("../config/db");

const Reply = {
  create: (postId, content, userId, callback) => {
    const query =
      "INSERT INTO replies (post_id, content, user_id) VALUES (?, ?, ?)";
    db.query(query, [postId, content, userId], callback);
  },
  findByPostId: (postId, callback) => {
    const query =
      "SELECT * FROM replies WHERE post_id = ? ORDER BY created_at DESC";
    db.query(query, [postId], callback);
  },
  deleteByIdAndUser: (replyId, userId, callback) => {
    const query = "DELETE FROM replies WHERE id = ? AND user_id = ?";
    db.query(query, [replyId, userId], callback);
  },
  // 可以根據需求擴充更多的資料庫操作方法
};

module.exports = Reply;
