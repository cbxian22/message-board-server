// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const http = require("http"); // 新增 http 模組

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const replyRoutes = require("./routes/replyRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const likeRoutes = require("./routes/likeRoutes");
const friendRoutes = require("./routes/friendRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");
const requestLogger = require("./middleware/requestLogger");
const { initializeWebSocket } = require("./config/websocket");

const db = require("./config/db");

dotenv.config();

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = initializeWebSocket(server); // 初始化 WebSocket
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
