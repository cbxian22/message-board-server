// 身份驗證（註冊、登入、登出）

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

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

        if (!process.env.JWT_SECRET) {
          console.error("JWT_SECRET 未設定");
          return res.status(500).json({ message: "伺服器設定錯誤" });
        }

        const token = jwt.sign(
          {
            userId: user.id,
            role: user.role,
            userName: user.name,
            userAvatar: user.avatar_url,
          },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        res.status(200).json({ success: true, token });
      }
    );
  } catch (error) {
    console.error("伺服器錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};

// 註冊
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
