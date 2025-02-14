// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const dotenv = require("dotenv");
// const http = require("http"); // 新增 http 模組
// const WebSocket = require("ws");

// const loginRoutes = require("./routes/loginRoutes");
// const registerRoutes = require("./routes/registerRoutes");
// const postRoutes = require("./routes/postRoutes");
// const replyRoutes = require("./routes/replyRoutes");
// const uploadRoutes = require("./routes/uploadRoutes");
// const errorMiddleware = require("./middleware/errorMiddleware");
// const requestLogger = require("./middleware/requestLogger");
// const db = require("./config/db");

// dotenv.config();

// const app = express();
// const server = http.createServer(app); // 使用 http 建立伺服器
// const wss = new WebSocket.Server({ server }); // WebSocket 伺服器與 HTTP 伺服器共用

// // 儲存所有 WebSocket 連接
// const clients = new Set();

// wss.on("connection", (ws) => {
//   console.log("Client connected");
//   clients.add(ws); // 加入客戶端

//   // 當收到訊息時，解析並廣播
//   ws.on("message", (message) => {
//     try {
//       const parsedMessage = JSON.parse(message);
//       console.log("Received message:", parsedMessage); // 確認收到訊息

//       // 廣播訊息給所有客戶端
//       clients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//           console.log("Broadcasting message to client:", parsedMessage); // 確認廣播
//           client.send(
//             JSON.stringify({ type: "new_message", data: parsedMessage })
//           );
//         }
//       });
//     } catch (error) {
//       console.error("Invalid message format:", error);
//     }
//   });

//   // 當客戶端斷開時，移除
//   ws.on("close", () => {
//     console.log("Client disconnected");
//     clients.delete(ws);
//   });

//   // 處理 WebSocket 錯誤
//   ws.on("error", (error) => {
//     console.error("WebSocket error:", error);
//   });
// });

// // === 中間件設定 ===
// // app.use(cors());
// app.use(
//   cors({
//     origin: "https://message-board-front.vercel.app", // 只允許前端域名
//     methods: ["GET", "POST", "PUT", "DELETE"], // 允許的 HTTP 方法
//     allowedHeaders: ["Content-Type", "Authorization"], // 允許的請求頭，新增 Authorization
//     credentials: true, // 是否允許攜帶憑證（例如 cookies）
//   })
// );

// app.use(bodyParser.json());
// app.use(requestLogger);
// app.use(errorMiddleware);

// // **新增 `/healthz` API，讓 Render 保持活躍**
// app.get("/healthz", (req, res) => {
//   db.query("SELECT 1", (err) => {
//     if (err) {
//       res.status(500).send("Render 保持活躍失敗");
//     } else {
//       res.send("render 保持活躍");
//     }
//   });
// });

// // 路由設定
// app.use("/api/login", loginRoutes);
// app.use("/api/register", registerRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/replies", replyRoutes);
// app.use("/api/upload", uploadRoutes);

// // 啟動伺服器
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`伺服器已啟動，監聽端口 ${PORT}`);
// });

// // module.exports = { app, server, broadcastMessage };
// module.exports = { app, server };

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const http = require("http");
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
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 儲存所有 WebSocket 連接（對象型態，用戶 ID 對應連線）
const clients = new Map();

wss.on("connection", (ws, req) => {
  // 解析 URL 取得 userId
  const params = new URLSearchParams(req.url.split("?")[1]);
  const userId = params.get("userId");

  if (!userId) {
    ws.close();
    return;
  }

  console.log(`✅ 使用者 ${userId} 已連接 WebSocket`);
  clients.set(userId, ws);

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("📩 收到訊息:", parsedMessage);

      if (parsedMessage.type === "NEW_MESSAGE") {
        const { chatId, senderId, content, timestamp } = parsedMessage.message;
        const newMessage = { chatId, senderId, content, timestamp };

        // 廣播訊息給聊天室中的所有人
        clients.forEach((clientWs, clientId) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({ type: "NEW_MESSAGE", message: newMessage })
            );
          }
        });
      }
    } catch (error) {
      console.error("❌ 無效的 WebSocket 訊息格式:", error);
    }
  });

  ws.on("close", () => {
    console.log(`❌ 使用者 ${userId} 斷開 WebSocket`);
    clients.delete(userId);
  });

  ws.on("error", (error) => {
    console.error("⚠️ WebSocket 發生錯誤:", error);
  });
});

// CORS 設定
app.use(
  cors({
    origin: "https://message-board-front.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(requestLogger);
app.use(errorMiddleware);

// **Render 保持活躍 API**
app.get("/healthz", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      res.status(500).send("Render 保持活躍失敗");
    } else {
      res.send("Render 保持活躍");
    }
  });
});

// 註冊 API 路由
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/upload", uploadRoutes);

// 啟動伺服器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 伺服器運行中，監聽端口 ${PORT}`);
});

module.exports = { app, server };
