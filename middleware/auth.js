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
// //
const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "your-access-token-secret";

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No or invalid Authorization header");
    return res.status(401).json({ message: "未授權" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId };
    console.log("Token decoded, userId:", decoded.userId); // 添加日誌
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: "無效的 token" });
  }
};
