// // 身份驗證（註冊、登入、登出）

// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const db = require("../config/db");

// // 登入
// exports.login = async (req, res) => {
//   const { account, password, role } = req.body;

//   try {
//     db.query(
//       "SELECT * FROM users WHERE account = ?",
//       [account],
//       async (err, results) => {
//         if (err) {
//           console.error("資料庫錯誤:", err);
//           return res.status(500).json({ message: "伺服器錯誤" });
//         }

//         if (results.length === 0) {
//           return res.status(400).json({ message: "帳號或密碼錯誤" });
//         }

//         const user = results[0];
//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//           return res.status(400).json({ message: "帳號或密碼錯誤" });
//         }

//         if (role !== user.role) {
//           return res
//             .status(403)
//             .json({ message: "角色驗證失敗，請選擇正確的角色" });
//         }

//         if (!process.env.JWT_SECRET) {
//           console.error("JWT_SECRET 未設定");
//           return res.status(500).json({ message: "伺服器設定錯誤" });
//         }

//         const token = jwt.sign(
//           {
//             userId: user.id,
//             role: user.role,
//             userName: user.name,
//             userAvatar: user.avatar_url,
//           },
//           process.env.JWT_SECRET,
//           { expiresIn: "15m" }
//         );

//         res.status(200).json({ success: true, token });
//       }
//     );
//   } catch (error) {
//     console.error("伺服器錯誤:", error);
//     res.status(500).json({ message: "伺服器錯誤" });
//   }
// };

// // 註冊
// exports.register = async (req, res) => {
//   const { name, account, password, role } = req.body;

//   try {
//     db.query(
//       "SELECT * FROM users WHERE account = ?",
//       [account],
//       async (err, results) => {
//         if (err) {
//           console.error("資料庫錯誤:", err);
//           return res.status(500).json({ message: "伺服器錯誤" });
//         }

//         if (results.length > 0) {
//           return res.status(400).json({ message: "帳號已被註冊" });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         db.query(
//           "INSERT INTO users (name, account, password, role) VALUES (?, ?, ?, ?)",
//           [name, account, hashedPassword, role],
//           (err) => {
//             if (err) {
//               console.error("資料庫錯誤:", err);
//               return res.status(500).json({ message: "註冊失敗" });
//             }
//             res.status(201).json({ success: true });
//           }
//         );
//       }
//     );
//   } catch (error) {
//     console.error("伺服器錯誤:", error);
//     res.status(500).json({ message: "伺服器錯誤" });
//   }
// };

// authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// 環境變數設置
const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "your-access-token-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";

// 登入
exports.login = async (req, res) => {
  const { account, password, role } = req.body;

  try {
    db.query(
      "SELECT * FROM users WHERE account = ?",
      [account],
      async (err, results) => {
        if (err) {
          console.error("資料庫錯誤:", err);
          return res.status(500).json({ message: "伺服器錯誤" });
        }

        if (results.length === 0) {
          return res.status(400).json({ message: "帳號或密碼錯誤" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(400).json({ message: "帳號或密碼錯誤" });
        }

        if (role !== user.role) {
          return res
            .status(403)
            .json({ message: "角色驗證失敗，請選擇正確的角色" });
        }

        if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
          console.error("JWT_SECRET 或 REFRESH_TOKEN_SECRET 未設定");
          return res.status(500).json({ message: "伺服器設定錯誤" });
        }

        // 生成 accessToken (15 分鐘到期)
        const accessToken = jwt.sign(
          {
            userId: user.id,
            role: user.role,
            userName: user.name,
            userAvatar: user.avatar_url,
          },
          ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        // 生成 refreshToken (7 天到期)
        const refreshToken = jwt.sign(
          { userId: user.id },
          REFRESH_TOKEN_SECRET,
          { expiresIn: "7d" }
        );

        // 儲存 refreshToken 到資料庫
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天後到期
        db.query(
          "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
          [user.id, refreshToken, expiresAt],
          (err) => {
            if (err) {
              console.error("儲存 refreshToken 失敗:", err);
              return res.status(500).json({ message: "伺服器錯誤" });
            }

            // 返回 token
            res.status(200).json({ success: true, accessToken, refreshToken });
          }
        );
      }
    );
  } catch (error) {
    console.error("伺服器錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

// 刷新 token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "缺少 refreshToken" });
  }

  try {
    // 檢查 refreshToken 是否存在且有效
    db.query(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [refreshToken],
      async (err, results) => {
        if (err) {
          console.error("資料庫錯誤:", err);
          return res.status(500).json({ message: "伺服器錯誤" });
        }

        if (
          results.length === 0 ||
          new Date(results[0].expires_at) < new Date()
        ) {
          return res
            .status(401)
            .json({ success: false, message: "無效或過期的 refreshToken" });
        }

        const storedToken = results[0];

        // 驗證 refreshToken
        let decoded;
        try {
          decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        } catch (error) {
          console.error("refreshToken 驗證失敗:", error);
          return res
            .status(401)
            .json({ success: false, message: "無效的 refreshToken" });
        }

        // 查找用戶
        db.query(
          "SELECT * FROM users WHERE id = ?",
          [decoded.userId],
          (err, userResults) => {
            if (err || userResults.length === 0) {
              console.error("查找用戶失敗:", err);
              return res
                .status(401)
                .json({ success: false, message: "用戶不存在" });
            }

            const user = userResults[0];

            // 生成新的 accessToken
            const newAccessToken = jwt.sign(
              {
                userId: user.id,
                role: user.role,
                userName: user.name,
                userAvatar: user.avatar_url,
              },
              ACCESS_TOKEN_SECRET,
              { expiresIn: "15m" }
            );

            // 可選：生成新的 refreshToken 並更新資料庫（Token Rotation）
            const newRefreshToken = jwt.sign(
              { userId: user.id },
              REFRESH_TOKEN_SECRET,
              { expiresIn: "7d" }
            );
            const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            db.query(
              "UPDATE refresh_tokens SET token = ?, expires_at = ? WHERE token = ?",
              [newRefreshToken, newExpiresAt, refreshToken],
              (err) => {
                if (err) {
                  console.error("更新 refreshToken 失敗:", err);
                  return res.status(500).json({ message: "伺服器錯誤" });
                }

                res.status(200).json({
                  success: true,
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("伺服器錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

// 註冊（保持不變）
exports.register = async (req, res) => {
  const { name, account, password, role } = req.body;

  try {
    db.query(
      "SELECT * FROM users WHERE account = ?",
      [account],
      async (err, results) => {
        if (err) {
          console.error("資料庫錯誤:", err);
          return res.status(500).json({ message: "伺服器錯誤" });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: "帳號已被註冊" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (name, account, password, role) VALUES (?, ?, ?, ?)",
          [name, account, hashedPassword, role],
          (err) => {
            if (err) {
              console.error("資料庫錯誤:", err);
              return res.status(500).json({ message: "註冊失敗" });
            }
            res.status(201).json({ success: true });
          }
        );
      }
    );
  } catch (error) {
    console.error("伺服器錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};
