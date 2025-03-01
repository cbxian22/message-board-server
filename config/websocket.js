// websocket.js
const { Server } = require("socket.io");

function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "https://message-board-front.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // 用戶socket映射
  const userSocketMap = new Map();

  io.on("connection", (socket) => {
    console.log("用戶已連接:", socket.id);

    // 用戶認證
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);
    }

    // 處理發送消息
    socket.on("sendMessage", (data) => {
      const { senderId, receiverId, content, media } = data; // media 為可選字段，包含圖片/影片數據
      const messageId = Date.now(); // 簡單生成唯一ID
      const message = {
        id: messageId,
        senderId,
        receiverId,
        content,
        media, // 如果有圖片或影片數據，直接傳遞
        isRead: false,
        createdAt: new Date(),
      };

      // 發送給接收者
      const receiverSocketId = userSocketMap.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", message);
      }

      // 回傳給發送者
      socket.emit("messageSent", message);
    });

    // 處理已讀標記
    socket.on("markAsRead", (messageId) => {
      // 通知發送者消息已讀
      const senderId = socket.handshake.query.userId; // 這裡假設發送者ID可從連接中獲取
      const senderSocketId = userSocketMap.get(senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageRead", { messageId });
      }
    });

    // 斷開連接
    socket.on("disconnect", () => {
      console.log("用戶斷開連接:", socket.id);
      userSocketMap.delete(userId);
    });
  });

  return io;
}

module.exports = { initializeWebSocket };
