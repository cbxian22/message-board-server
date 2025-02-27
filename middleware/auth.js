// const jwt = require("jsonwebtoken");
// const ACCESS_TOKEN_SECRET =
//   process.env.JWT_SECRET || "your-access-token-secret";

// module.exports = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "未授權" });
//   }

//   const token = authHeader.split(" ")[1];
//   try {
//     const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
//     req.user = { userId: decoded.userId }; // 僅提取 userId
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "無效的 token" });
//   }
// };
// middleware/auth.js
// middleware/auth.js
// middleware/auth.js
const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "your-access-token-secret";

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("無 Authorization 頭部，視為未登入");
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId };
    console.log("Token 解析成功，userId:", decoded.userId);
    next();
  } catch (error) {
    console.error("Token 解析失敗:", error.message);
    req.user = null;
    next(); // token 無效時繼續執行，視為未登入
  }
};
