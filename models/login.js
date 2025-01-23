const db = require("../config/db");

const login = {
  // 新增用戶
  create: (username, password, role, callback) => {
    const query =
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    db.query(query, [username, password, role], callback);
  },
  // 查找用戶 by username
  findByUsername: (username, callback) => {
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], callback);
  },
  // 可擴充的方法
};

module.exports = login;
