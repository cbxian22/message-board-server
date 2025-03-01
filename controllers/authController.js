// // // // 身份驗證（註冊、登入、登出）

// authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const util = require("util");

// 將 db.query 轉為 Promise 形式
const query = util.promisify(db.query).bind(db);

const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "your-access-token-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";

// 啟動時檢查環境變數
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT_SECRET 或 REFRESH_TOKEN_SECRET 未設定");
}

// 註冊
exports.register = async (req, res) => {
  const { account, password, name, role } = req.body;

  if (!account || !password || !name || !role) {
    return res.status(400).json({ message: "請提供帳號、密碼、名稱和角色" });
  }
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "角色必須是 'admin' 或 'user'" });
  }

  try {
    const results = await query("SELECT * FROM users WHERE account = ?", [
      account,
    ]);
    if (results.length > 0) {
      return res.status(400).json({ message: "帳號已被註冊" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      "INSERT INTO users (account, password, name, role, is_private) VALUES (?, ?, ?, ?, ?)",
      [account, hashedPassword, name, role, false]
    );
    res.status(201).json({ success: true, message: "註冊成功" });
  } catch (error) {
    console.error("註冊失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

// 登入
// exports.login = async (req, res) => {
//   const { account, password, role } = req.body;

//   try {
//     db.query(
//       "SELECT * FROM users WHERE account = ?",
//       [account],
//       async (err, results) => {
//         if (err) return res.status(500).json({ message: "伺服器錯誤" });
//         if (results.length === 0)
//           return res.status(400).json({ message: "帳號或密碼錯誤" });

//         const user = results[0];
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch)
//           return res.status(400).json({ message: "帳號或密碼錯誤" });
//         if (role !== user.role)
//           return res.status(403).json({ message: "角色驗證失敗" });

//         const accessToken = jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, {
//           expiresIn: "15m",
//         });
//         const refreshToken = jwt.sign(
//           { userId: user.id },
//           REFRESH_TOKEN_SECRET,
//           { expiresIn: "7d" }
//         );

//         // 檢查現有 token 數量
//         db.query(
//           "SELECT COUNT(*) as tokenCount FROM refresh_tokens WHERE user_id = ?",
//           [user.id],
//           (err, countResults) => {
//             if (err) return res.status(500).json({ message: "伺服器錯誤" });

//             const tokenCount = countResults[0].tokenCount;
//             if (tokenCount >= 2) {
//               // 刪除最早的 refreshToken
//               db.query(
//                 "DELETE FROM refresh_tokens WHERE user_id = ? ORDER BY expires_at ASC LIMIT 1",
//                 [user.id],
//                 (err) => {
//                   if (err)
//                     return res.status(500).json({ message: "伺服器錯誤" });
//                   insertNewToken();
//                 }
//               );
//             } else {
//               insertNewToken();
//             }
//           }
//         );

//         function insertNewToken() {
//           const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
//           db.query(
//             "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
//             [user.id, refreshToken, expiresAt],
//             (err) => {
//               if (err) return res.status(500).json({ message: "伺服器錯誤" });
//               res
//                 .status(200)
//                 .json({ success: true, accessToken, refreshToken });
//             }
//           );
//         }
//       }
//     );
//   } catch (error) {
//     res.status(500).json({ message: "伺服器錯誤" });
//   }
// };
// 登入
exports.login = async (req, res) => {
  const { account, password, role } = req.body;

  try {
    const results = await query("SELECT * FROM users WHERE account = ?", [
      account,
    ]);
    if (results.length === 0) {
      return res.status(400).json({ message: "帳號或密碼錯誤" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "帳號或密碼錯誤" });
    }
    if (role !== user.role) {
      return res.status(403).json({ message: "角色驗證失敗" });
    }

    const accessToken = jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    // 檢查現有 token 數量
    const countResults = await query(
      "SELECT COUNT(*) as tokenCount FROM refresh_tokens WHERE user_id = ?",
      [user.id]
    );
    const tokenCount = countResults[0].tokenCount;

    if (tokenCount >= 2) {
      // 刪除最早的 refreshToken
      await query(
        "DELETE FROM refresh_tokens WHERE user_id = ? ORDER BY expires_at ASC LIMIT 1",
        [user.id]
      );
    }

    // 插入新的 refreshToken
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, refreshToken, expiresAt]
    );

    res.status(200).json({ success: true, accessToken, refreshToken });
  } catch (error) {
    console.error("登入失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

// 刷新 token
// exports.refreshToken = async (req, res) => {
//   const { refreshToken } = req.body;
//   if (!refreshToken)
//     return res
//       .status(400)
//       .json({ success: false, message: "缺少 refreshToken" });

//   try {
//     // 驗證 refreshToken
//     const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

//     // 檢查資料庫中是否存在該 refreshToken 且未過期
//     db.query(
//       "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
//       [refreshToken],
//       (err, results) => {
//         if (err) {
//           console.error("資料庫查詢錯誤:", err);
//           return res
//             .status(500)
//             .json({ success: false, message: "伺服器錯誤" });
//         }
//         if (results.length === 0) {
//           return res
//             .status(401)
//             .json({ success: false, message: "無效或過期的 refreshToken" });
//         }

//         // 生成新的 accessToken
//         const newAccessToken = jwt.sign(
//           { userId: decoded.userId },
//           ACCESS_TOKEN_SECRET,
//           { expiresIn: "15m" }
//         );

//         // 返回新的 accessToken 和原始的 refreshToken，不更新資料庫
//         res.status(200).json({
//           success: true,
//           accessToken: newAccessToken,
//           refreshToken: refreshToken, // 保持原始 refreshToken 不變
//         });
//       }
//     );
//   } catch (error) {
//     console.error("Refresh token 驗證失敗:", error);
//     return res
//       .status(401)
//       .json({ success: false, message: "無效的 refreshToken" });
//   }
// };
// 刷新 token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "缺少 refreshToken" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const results = await query(
      "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
      [refreshToken]
    );

    if (results.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "無效或過期的 refreshToken" });
    }

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Refresh token 驗證失敗:", error);
    res.status(401).json({ success: false, message: "無效的 refreshToken" });
  }
};

// 登出所有裝置
exports.logoutAll = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await query("DELETE FROM refresh_tokens WHERE user_id = ?", [
      userId,
    ]);
    console.log(
      `已從所有裝置登出，用戶ID: ${userId}, 刪除數量: ${result.affectedRows}`
    );
    res.status(200).json({ success: true, message: "已從所有裝置登出" });
  } catch (error) {
    console.error("登出所有裝置失敗:", error);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
};

// 定時清理過期 token
const cleanupExpiredTokens = async () => {
  try {
    const result = await query(
      "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
    );
    console.log(`已清理過期的 refreshToken，數量: ${result.affectedRows}`);
  } catch (error) {
    console.error("清理過期 refreshToken 失敗:", error);
  }
};
setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // 每小時執行一次
cleanupExpiredTokens(); // 啟動時執行一次

// 登出
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "缺少 refreshToken" });
  }

  try {
    console.log("收到登出請求，refreshToken:", refreshToken); // 添加日誌
    const result = await query("DELETE FROM refresh_tokens WHERE token = ?", [
      refreshToken,
    ]);

    if (result.affectedRows === 0) {
      console.warn("未找到匹配的 refreshToken:", refreshToken);
      return res
        .status(200)
        .json({ success: true, message: "令牌不存在，已登出" });
    }

    console.log("成功刪除 refreshToken:", refreshToken);
    res.status(200).json({ success: true, message: "已登出" });
  } catch (error) {
    console.error("登出處理失敗:", error);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
};

// exports.register = async (req, res) => {
//   const { account, password, name, role } = req.body;

//   if (!account || !password || !name || !role) {
//     return res.status(400).json({ message: "請提供帳號、密碼、名稱和角色" });
//   }
//   if (!["admin", "user"].includes(role)) {
//     return res.status(400).json({ message: "角色必須是 'admin' 或 'user'" });
//   }

//   try {
//     db.query(
//       "SELECT * FROM users WHERE account = ?",
//       [account],
//       async (err, results) => {
//         if (err) return res.status(500).json({ message: "伺服器錯誤" });
//         if (results.length > 0)
//           return res.status(400).json({ message: "帳號已被註冊" });
//         const hashedPassword = await bcrypt.hash(password, 10);
//         db.query(
//           "INSERT INTO users (account, password, name, role, is_private) VALUES (?, ?, ?, ?, ?)",
//           [account, hashedPassword, name, role, false], // 新增 is_private
//           (err, result) => {
//             if (err) return res.status(500).json({ message: "註冊失敗" });
//             res.status(201).json({ success: true, message: "註冊成功" });
//           }
//         );
//       }
//     );
//   } catch (error) {
//     res.status(500).json({ message: "伺服器錯誤" });
//   }
// };

// 獲取當前用戶資訊
exports.getCurrentUser = async (req, res) => {
  const userId = req.user.userId;

  try {
    const results = await query(
      "SELECT id, name, account, intro, avatar_url, role, is_private FROM users WHERE id = ?",
      [userId]
    );
    if (results.length === 0) {
      return res.status(404).json({ message: "用戶不存在" });
    }
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("獲取用戶資訊失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};
