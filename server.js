const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const http = require("http"); // 新增 http 模組
const WebSocket = require("ws");

const loginRoutes = require("./routes/loginRoutes");
const registerRoutes = require("./routes/registerRoutes");
const postRoutes = require("./routes/postRoutes");
const replyRoutes = require("./routes/replyRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const requestLogger = require("./middleware/requestLogger");
const db = require("./config/db");

dotenv.config();

const app = express();
const server = http.createServer(app); // 使用 http 建立伺服器
const wss = new WebSocket.Server({ server }); // WebSocket 伺服器與 HTTP 伺服器共用

// === CORS 設定 ===
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://message-board-front.vercel.app"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true"); // 允許攜帶憑證（如 cookies）
  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // 預檢請求回應 204 No Content
  }
  next();
});

// === WebSocket 連線管理 ===
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("Received:", message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

app.use(cors());
// app.use(
//   cors({
//     origin: "https://message-board-front.vercel.app", // 只允許前端域名
//     methods: ["GET", "POST", "PUT", "DELETE"], // 允許的 HTTP 方法
//     allowedHeaders: ["Content-Type", "Authorization"], // 允許的請求頭，新增 Authorization
//     credentials: true, // 是否允許攜帶憑證（例如 cookies）
//   })
// );

// WebSocket 廣播函式
const broadcastMessage = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// === 中間件設定 ===
app.use(bodyParser.json());
app.use(requestLogger);
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

module.exports = { app, server, broadcastMessage };
