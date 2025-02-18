const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// 登入
exports.login = async (req, res) => {
  const { account, password, role } = req.body; // 加入 role

  try {
    // 查詢用戶是否存在
    db.query(
      "SELECT * FROM users WHERE account = ?",
      [account],
      async (err, results) => {
        if (err) {
          console.error("資料庫錯誤:", err);
          return res.status(500).json({ message: "伺服器錯誤" });
        }

        if (results.length === 0) {
          return res.status(400).json({ message: "用戶名或密碼錯誤" });
        }

        const user = results[0];

        // 比較密碼是否正確
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`密碼比較結果: ${isMatch}`); // 查看密碼是否正確

        if (!isMatch) {
          return res.status(400).json({ message: "用戶名或密碼錯誤" });
        }

        // 驗證角色是否正確
        if (role !== user.role) {
          console.log(`角色不匹配: 請求角色 ${role}, 用戶角色 ${user.role}`);
          return res
            .status(403)
            .json({ message: "角色驗證失敗，請選擇正確的角色" });
        }

        // 確保環境變數存在
        if (!process.env.JWT_SECRET) {
          console.error("JWT_SECRET 未設定");
          return res.status(500).json({ message: "伺服器設定錯誤" });
        }

        // 簽發 JWT
        const token = jwt.sign(
          { userId: user.id, role: user.role, userName: user.name },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        // 回傳成功的 token
        res.status(200).json({
          success: true,
          token: token,
          // userId: user.id,
        });
      }
    );
  } catch (error) {
    console.error("伺服器錯誤:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
};
