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
const db = require("./config/db");
const WebSocket = require("ws"); // 新增 WebSocket
const http = require("http"); // 確保 HTTP 伺服器載入

dotenv.config();

const app = express();
const server = http.createServer(app); // 正確建立 HTTP 伺服器
// 設定 WebSocket 伺服器
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("✅ 新的 WebSocket 連接");

  ws.on("message", (message) => {
    console.log("📩 收到 WebSocket 訊息:", message);

    // 當有新留言時，通知所有客戶端
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("🔴 WebSocket 連線已關閉");
  });
});

// **讓 `wss` 和 `server` 可以被 postController.js 引用**
module.exports = { app, server, wss };

// Middleware 設定
// app.use(cors());
app.use(
  cors({
    origin: "https://message-board-front.vercel.app", // 只允許前端域名
    methods: ["GET", "POST", "PUT", "DELETE"], // 允許的 HTTP 方法
    allowedHeaders: ["Content-Type", "Authorization"], // 允許的請求頭，新增 Authorization
    credentials: true, // 是否允許攜帶憑證（例如 cookies）
  })
);
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://message-board-front.vercel.app"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(bodyParser.json());
app.use(requestLogger);
// 錯誤處理
app.use(errorMiddleware);

// **新增 `/healthz` API，讓 Render 保持活躍**
app.get("/healthz", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      res.status(500).send("Render 保持活躍失敗");
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

// 啟動伺服器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`伺服器已啟動，監聽端口 ${PORT}`);
});
