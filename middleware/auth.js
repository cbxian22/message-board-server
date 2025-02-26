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
const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "your-access-token-secret";

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null; // 未提供 token，設置為 null
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId };
    console.log("Token 解析成功，userId:", decoded.userId); // 調試用日誌
    next();
  } catch (error) {
    console.error("Token 無效:", error.message);
    return res.status(401).json({ message: "無效的 token" });
  }
};
