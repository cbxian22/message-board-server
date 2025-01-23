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

dotenv.config();

const app = express();

// Middleware 設定
// app.use(cors());
app.use(
  cors({
    origin: "https://message-board-front.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(requestLogger);

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
