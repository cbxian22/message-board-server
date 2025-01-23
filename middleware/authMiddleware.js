const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // 取得授權頭部中的 Bearer Token

  if (!token) {
    return res.status(401).json({ message: "請先登入" });
  }

  // 驗證 Token
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ message: "無效的 Token" });
    }

    const { userId } = decodedToken;

    // 從資料庫驗證使用者ID是否存在
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [userId], (dbErr, results) => {
      if (dbErr) {
        return res.status(500).json({ message: "資料庫錯誤" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "用户不存在" });
      }

      // 使用者驗證通過，將使用者資訊附加到請求中
      req.user = {
        userId: results[0].id,
        userName: results[0].name,
        role: results[0].role,
      };

      next(); // 繼續執行後續的路由處理
    });
  });
};

module.exports = authenticateToken;
