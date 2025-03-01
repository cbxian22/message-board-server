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

  const userSocketMap = new Map();

  io.on("connection", (socket) => {
    console.log("用戶已連接:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);
    }

    socket.on("sendMessage", (data) => {
      const { senderId, receiverId, content, media } = data;
      const messageId = Date.now();
      const message = {
        id: messageId,
        senderId,
        receiverId,
        content,
        media,
        isRead: false,
        createdAt: new Date(),
      };

      const receiverSocketId = userSocketMap.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", message);
      }
      socket.emit("messageSent", message);
    });

    // 修改為接收 senderId
    socket.on("markAsRead", ({ messageId, senderId }) => {
      const senderSocketId = userSocketMap.get(senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageRead", { messageId });
      }
    });

    socket.on("disconnect", () => {
      console.log("用戶斷開連接:", socket.id);
      userSocketMap.delete(userId);
    });
  });

  return io;
}

module.exports = { initializeWebSocket };
