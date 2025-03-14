// 身份驗證（註冊、登入、登出）

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const ACCESS_TOKEN_SECRET =
  process.env.JWT_SECRET || "your-access-token-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT_SECRET 或 REFRESH_TOKEN_SECRET 未設定");
}

exports.login = async (req, res) => {
  const { account, password, role } = req.body;
  try {
    db.query(
      "SELECT * FROM users WHERE account = ?",
      [account],
      async (err, results) => {
        if (err) return res.status(500).json({ message: "伺服器錯誤" });
        if (results.length === 0)
          return res.status(400).json({ message: "帳號或密碼錯誤" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(400).json({ message: "帳號或密碼錯誤" });
        if (role !== user.role)
          return res.status(403).json({ message: "角色驗證失敗" });

        const accessToken = jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, {
          expiresIn: "15m",
        });
        const refreshToken = jwt.sign(
          { userId: user.id },
          REFRESH_TOKEN_SECRET,
          { expiresIn: "7d" }
        );

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        db.query(
          "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
          [user.id, refreshToken, expiresAt],
          (err) => {
            if (err) return res.status(500).json({ message: "伺服器錯誤" });
            res.status(200).json({ success: true, accessToken, refreshToken });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res
      .status(400)
      .json({ success: false, message: "缺少 refreshToken" });

  try {
    // 驗證 refreshToken
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // 檢查資料庫中是否存在該 refreshToken 且未過期
    db.query(
      "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
      [refreshToken],
      (err, results) => {
        if (err) {
          console.error("資料庫查詢錯誤:", err);
          return res
            .status(500)
            .json({ success: false, message: "伺服器錯誤" });
        }
        if (results.length === 0) {
          return res
            .status(401)
            .json({ success: false, message: "無效或過期的 refreshToken" });
        }

        // 生成新的 accessToken
        const newAccessToken = jwt.sign(
          { userId: decoded.userId },
          ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        // 返回新的 accessToken 和原始的 refreshToken，不更新資料庫
        res.status(200).json({
          success: true,
          accessToken: newAccessToken,
          refreshToken: refreshToken, // 保持原始 refreshToken 不變
        });
      }
    );
  } catch (error) {
    console.error("Refresh token 驗證失敗:", error);
    return res
      .status(401)
      .json({ success: false, message: "無效的 refreshToken" });
  }
};

exports.logoutAll = async (req, res) => {
  const userId = req.user.userId;
  try {
    db.query(
      "DELETE FROM refresh_tokens WHERE user_id = ?",
      [userId],
      (err, result) => {
        if (err) {
          console.error("刪除所有 refreshToken 失敗:", err);
          return res
            .status(500)
            .json({ success: false, message: "伺服器錯誤" });
        }
        res.status(200).json({ success: true, message: "已從所有裝置登出" });
      }
    );
  } catch (error) {
    console.error("登出所有裝置處理失敗:", error);
    return res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "缺少 refreshToken" });
  }

  try {
    db.query(
      "DELETE FROM refresh_tokens WHERE token = ?",
      [refreshToken],
      (err, result) => {
        if (err) {
          console.error("刪除 refreshToken 失敗:", err);
          return res
            .status(500)
            .json({ success: false, message: "伺服器錯誤" });
        }
        res.status(200).json({ success: true, message: "已登出" });
      }
    );
  } catch (error) {
    console.error("登出處理失敗:", error);
    return res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
};

exports.register = async (req, res) => {
  const { account, password, name, accountname, role } = req.body;

  if (!account || !password || !name || !accountname || !role) {
    return res
      .status(400)
      .json({ message: "請提供帳號、密碼、名稱、用戶名稱和角色" });
  }
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "角色必須是 'admin' 或 'user'" });
  }

  try {
    db.query(
      "SELECT * FROM users WHERE account = ?",
      [account],
      async (err, results) => {
        if (err) return res.status(500).json({ message: "伺服器錯誤" });
        if (results.length > 0)
          return res.status(400).json({ message: "帳號已被註冊" });
        // 檢查 accountname 是否已被使用
        db.query(
          "SELECT * FROM users WHERE accountname = ?",
          [accountname],
          async (err, results) => {
            if (err) return res.status(500).json({ message: "伺服器錯誤" });
            if (results.length > 0)
              return res.status(400).json({ message: "用戶名稱已被使用" });

            const hashedPassword = await bcrypt.hash(password, 10);
            db.query(
              "INSERT INTO users (account, password, name, accountname, role, is_private) VALUES (?, ?, ?, ?, ?, ?)",
              [account, hashedPassword, name, accountname, role, false],
              (err, result) => {
                if (err) return res.status(500).json({ message: "註冊失敗" });
                res.status(201).json({ success: true, message: "註冊成功" });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

exports.getCurrentUser = (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "未提供有效的認證憑證" });
  }

  const userId = req.user.userId;
  db.query(
    "SELECT id, name, account, accountname, intro, avatar_url, role, is_private FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("資料庫查詢失敗:", err.message);
        return res.status(500).json({
          message: "伺服器錯誤",
          error: err.message,
        });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "用戶不存在" });
      }
      res.status(200).json(results[0]);
    }
  );
};
