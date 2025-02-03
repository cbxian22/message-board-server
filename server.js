const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const loginRoutes = require("./routes/loginRoutes");
const registerRoutes = require("./routes/registerRoutes");
const postRoutes = require("./routes/postRoutes");
const replyRoutes = require("./routes/replyRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const requestLogger = require("./middleware/requestLogger");
const db = require("../config/db");
dotenv.config();

const app = express();

// Middleware 設定
// app.use(cors());
app.use(
  cors({
    origin: "https://message-board-front.vercel.app", // 允許的前端域名
    methods: ["GET", "POST"], // 允許的 HTTP 方法
    allowedHeaders: ["Content-Type", "Authorization"], // 允許的請求頭，新增 Authorization
    credentials: true, // 是否允許攜帶憑證（例如 cookies）
  })
);

app.use(bodyParser.json());
app.use(requestLogger);

// **新增 `/healthz` API，讓 Render 保持活躍**
app.get("/healthz", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      res.status(500).send(" 活躍失敗");
    } else {
      res.send("render 保持活躍");
    }
  });
});

// 路由設定
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/upload", uploadRoutes);

// 錯誤處理
app.use(errorMiddleware);

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器已啟動，監聽端口 ${PORT}`);
});
