// // middleware/auth.js
// const jwt = require("jsonwebtoken");
// const ACCESS_TOKEN_SECRET =
//   process.env.JWT_SECRET || "your-access-token-secret";

// module.exports = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     console.log("無 Authorization 頭部，視為未登入");
//     req.user = null;
//     return next();
//   }

//   const token = authHeader.split(" ")[1];
//   try {
//     const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
//     req.user = { userId: decoded.userId };
//     console.log("Token 解析成功，userId:", decoded.userId);
//     next();
//   } catch (error) {
//     console.error("Token 解析失敗:", error.message);
//     req.user = null;
//     next(); // token 無效時繼續執行，視為未登入
//   }
// };

// middleware/auth.js
const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "your-access-token-secret";

module.exports =
  (options = { required: false }) =>
  (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      if (options.required) {
        return res.status(401).json({ message: "未提供認證憑證" });
      }
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
      if (options.required) {
        return res.status(401).json({ message: "無效或過期的認證憑證" });
      }
      req.user = null;
      next();
    }
  };
