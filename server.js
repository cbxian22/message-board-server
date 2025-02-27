// === 依賴導入 ===
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const WebSocket = require("ws");

// 路由檔案
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const replyRoutes = require("./routes/replyRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const likeRoutes = require("./routes/likeRoutes");
const friendRoutes = require("./routes/friendRoutes");

// 中間件與配置
const errorMiddleware = require("./middleware/errorMiddleware");
const requestLogger = require("./middleware/requestLogger");
const db = require("./config/db");

// === 環境設定 ===
dotenv.config();

// === 應用初始化 ===
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === WebSocket 設定 ===
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("Received message:", parsedMessage);

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log("Broadcasting message to client:", parsedMessage);
          client.send(
            JSON.stringify({ type: "new_message", data: parsedMessage })
          );
        }
      });
    } catch (error) {
      console.error("Invalid message format:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// === 中間件設定 ===
app.use(express.json());
app.use(
  cors({
    origin: "https://message-board-front.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "x-goog-algorithm",
      "x-goog-credential",
      "x-goog-date",
      "x-goog-expires",
      "x-goog-signedheaders",
      "x-goog-signature",
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  })
);
app.use(requestLogger);
app.use(errorMiddleware);

// === 路由設定 ===
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/like", likeRoutes);
app.use("/api/friends", friendRoutes);

// === 伺服器啟動 ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`伺服器已啟動，監聽端口 ${PORT}`);
});

// === 模組匯出 ===
module.exports = { app, server };
