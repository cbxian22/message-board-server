// const db = require("../config/db");

// const Post = {
//   create: (content, userId, callback) => {
//     const query = "INSERT INTO posts ( content, user_id) VALUES (?, ?)";
//     db.query(query, [content, userId], callback);
//   },
//   findAll: (callback) => {
//     const query = "SELECT * FROM posts ORDER BY updated_at DESC";
//     db.query(query, callback);
//   },
//   findById: (id, callback) => {
//     const query = "SELECT * FROM posts WHERE id = ?";
//     db.query(query, [id], callback);
//   },
//   // 可以根據需求擴充更多的資料庫操作方法
// };

// module.exports = Post;
