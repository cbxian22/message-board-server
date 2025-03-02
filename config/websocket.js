// // websocket.js
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
//   const offlineMessages = new Map(); // 儲存離線消息，key: receiverId, value: [message]

//   io.on("connection", (socket) => {
//     console.log("用戶已連接:", socket.id);

//     const userId = socket.handshake.query.userId;
//     if (userId) {
//       userSocketMap.set(userId, socket.id);
//       console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);

//       // 推送離線消息
//       if (offlineMessages.has(userId)) {
//         const messages = offlineMessages.get(userId);
//         console.log(`推送離線消息給 ${userId}:`, messages);
//         socket.emit("offlineMessages", messages);
//         offlineMessages.delete(userId); // 推送後清除
//       }
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
//         console.log(`接收者 ${receiverId} 未在線，儲存離線消息`);
//         if (!offlineMessages.has(receiverId)) {
//           offlineMessages.set(receiverId, []);
//         }
//         offlineMessages.get(receiverId).push(message);
//       }
//       console.log(`回傳給發送者 ${senderId}:`, message);
//       socket.emit("messageSent", message);
//     });

//     socket.on("markAsRead", ({ messageId, senderId }) => {
//       console.log(`標記消息 ${messageId} 為已讀，通知發送者 ${senderId}`);
//       const senderSocketId = userSocketMap.get(senderId.toString());
//       if (senderSocketId) {
//         console.log(`通知發送者 ${senderId} (socket: ${senderSocketId}) 已讀`);
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

// websocket.js // line version
const { Server } = require("socket.io");

function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "https://message-board-front.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map(); // key: userId, value: [socketId]
  const tempMessages = new Map(); // key: userId, value: [{ message, timestamp }]
  const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 小時（毫秒）

  // 定時清理過期消息（每小時檢查一次）
  setInterval(() => {
    const now = Date.now();
    tempMessages.forEach((messages, userId) => {
      const filtered = messages.filter(
        (entry) => now - entry.timestamp < EXPIRY_TIME
      );
      if (filtered.length > 0) {
        tempMessages.set(userId, filtered);
      } else {
        tempMessages.delete(userId);
      }
    });
    console.log("清理過期消息後，tempMessages:", tempMessages);
  }, 60 * 60 * 1000); // 每小時

  io.on("connection", (socket) => {
    console.log("用戶已連接:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
      if (!userSocketMap.has(userId)) userSocketMap.set(userId, []);
      userSocketMap.get(userId).push(socket.id);
      console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);

      // 推送短期同步消息
      if (tempMessages.has(userId)) {
        const messages = tempMessages.get(userId).map((entry) => entry.message);
        console.log(`推送短期同步消息給 ${userId}:`, messages);
        socket.emit("syncMessages", messages);
      }
    }

    socket.on("sendMessage", (data) => {
      console.log("收到 sendMessage:", data);
      const { senderId, receiverId, content, media } = data;
      const messageId = Date.now();
      const message = {
        id: messageId,
        senderId,
        receiverId,
        content,
        media,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // 儲存到臨時記憶體
      const timestamp = Date.now();
      if (!tempMessages.has(senderId)) tempMessages.set(senderId, []);
      if (!tempMessages.has(receiverId)) tempMessages.set(receiverId, []);
      tempMessages.get(senderId).push({ message, timestamp });
      tempMessages.get(receiverId).push({ message, timestamp });

      const receiverSocketIds = userSocketMap.get(receiverId.toString()) || [];
      receiverSocketIds.forEach((socketId) => {
        console.log(
          `發送給接收者 ${receiverId} (socket: ${socketId}):`,
          message
        );
        io.to(socketId).emit("receiveMessage", message);
      });

      const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
      senderSocketIds.forEach((socketId) => {
        console.log(`回傳給發送者 ${senderId} (socket: ${socketId}):`, message);
        io.to(socketId).emit("messageSent", message);
      });
    });

    socket.on("markAsRead", ({ messageId, senderId }) => {
      console.log(`標記消息 ${messageId} 為已讀，通知發送者 ${senderId}`);
      const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
      senderSocketIds.forEach((socketId) => {
        console.log(`通知發送者 ${senderId} (socket: ${socketId}) 已讀`);
        io.to(socketId).emit("messageRead", { messageId });
      });
    });

    socket.on("disconnect", () => {
      console.log("用戶斷開連接:", socket.id);
      if (userId && userSocketMap.has(userId)) {
        const sockets = userSocketMap.get(userId);
        const index = sockets.indexOf(socket.id);
        if (index > -1) sockets.splice(index, 1);
        if (sockets.length === 0) userSocketMap.delete(userId);
      }
    });
  });

  return io;
}

module.exports = { initializeWebSocket };
