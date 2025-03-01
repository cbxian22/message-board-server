// websocket.js (位於 config/websocket.js 或根目錄，根據你的 server.js 路徑)
// const { Server } = require("socket.io");

// function initializeWebSocket(server) {
//   const io = new Server(server, {
//     cors: {
//       origin: "https://message-board-front.vercel.app",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   const userSocketMap = new Map();

//   io.on("connection", (socket) => {
//     console.log("用戶已連接:", socket.id);

//     const userId = socket.handshake.query.userId;
//     if (userId) {
//       userSocketMap.set(userId, socket.id);
//       console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);
//     }

//     socket.on("sendMessage", (data) => {
//       console.log("收到 sendMessage:", data);
//       const { senderId, receiverId, content, media } = data;
//       const messageId = Date.now();
//       const message = {
//         id: messageId,
//         senderId,
//         receiverId,
//         content,
//         media,
//         isRead: false,
//         createdAt: new Date(),
//       };

//       const receiverSocketId = userSocketMap.get(receiverId.toString());
//       if (receiverSocketId) {
//         console.log(
//           `發送給接收者 ${receiverId} (socket: ${receiverSocketId}):`,
//           message
//         );
//         io.to(receiverSocketId).emit("receiveMessage", message);
//       } else {
//         console.log(`接收者 ${receiverId} 未在線`);
//       }
//       console.log(`回傳給發送者 ${senderId}:`, message);
//       socket.emit("messageSent", message);
//     });

//     socket.on("markAsRead", ({ messageId, senderId }) => {
//       console.log(`標記消息 ${messageId} 為已讀，通知發送者 ${senderId}`);
//       const senderSocketId = userSocketMap.get(senderId.toString());
//       if (senderSocketId) {
//         io.to(senderSocketId).emit("messageRead", { messageId });
//       } else {
//         console.log(`發送者 ${senderId} 未在線`);
//       }
//     });

//     socket.on("disconnect", () => {
//       console.log("用戶斷開連接:", socket.id);
//       userSocketMap.delete(userId);
//     });
//   });

//   return io;
// }

// module.exports = { initializeWebSocket };

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
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap.set(userId, socket.id);

    socket.on("sendMessage", (message) => {
      const receiverSocketId = userSocketMap.get(message.receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", message);
      }
    });

    socket.on("markAsRead", ({ messageId, senderId }) => {
      const senderSocketId = userSocketMap.get(senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageRead", { messageId });
      }
    });

    socket.on("disconnect", () => {
      userSocketMap.forEach((socketId, userId) => {
        if (socketId === socket.id) userSocketMap.delete(userId);
      });
    });
  });

  return io;
}

module.exports = { initializeWebSocket };
