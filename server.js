const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const http = require("http"); // 新增 http 模組
const WebSocket = require("ws");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const replyRoutes = require("./routes/replyRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const likeRoutes = require("./routes/likeRoutes");
const friendRoutes = require("./routes/friendRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");
const requestLogger = require("./middleware/requestLogger");

const db = require("./config/db");

dotenv.config();

const app = express();
app.use(express.json());
const server = http.createServer(app); // 使用 http 建立伺服器
const wss = new WebSocket.Server({ server }); // WebSocket 伺服器與 HTTP 伺服器共用

// 儲存所有 WebSocket 連接
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws); // 加入客戶端

  // 當收到訊息時，解析並廣播
  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("Received message:", parsedMessage); // 確認收到訊息

      // 廣播訊息給所有客戶端
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log("Broadcasting message to client:", parsedMessage); // 確認廣播
          client.send(
            JSON.stringify({ type: "new_message", data: parsedMessage })
          );
        }
      });
    } catch (error) {
      console.error("Invalid message format:", error);
    }
  });

  // 當客戶端斷開時，移除
  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  // 處理 WebSocket 錯誤
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// === 中間件設定 ===
// app.use(cors());
app.use(
  cors({
    origin: "https://message-board-front.vercel.app", // 只允許前端域名
    methods: ["GET", "POST", "PUT", "DELETE"], // 允許的 HTTP 方法
    allowedHeaders: [
      "x-goog-algorithm",
      "x-goog-credential",
      "x-goog-date",
      "x-goog-expires",
      "x-goog-signedheaders",
      "x-goog-signature",
      "Content-Type",
      "Authorization",
    ], // 允許的請求頭，新增 Authorization
    credentials: true, // 是否允許攜帶憑證（例如 cookies）
  })
);

app.use(bodyParser.json());
app.use(requestLogger);
app.use(errorMiddleware);

// 路由設定
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/like", likeRoutes);
app.use("/api/friends", friendRoutes);

// 啟動伺服器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`伺服器已啟動，監聽端口 ${PORT}`);
});

// module.exports = { app, server, broadcastMessage };
module.exports = { app, server };
