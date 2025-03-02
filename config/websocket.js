// websocket.js //  version 1 line
// const { Server } = require("socket.io");

// function initializeWebSocket(server) {
//   const io = new Server(server, {
//     cors: {
//       origin: "https://message-board-front.vercel.app",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   const userSocketMap = new Map(); // key: userId, value: [socketId]
//   const tempMessages = new Map(); // key: userId, value: [{ message, timestamp }]
//   const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 小時（毫秒）

//   // 定時清理過期消息（每小時檢查一次）
//   setInterval(() => {
//     const now = Date.now();
//     tempMessages.forEach((messages, userId) => {
//       const filtered = messages.filter(
//         (entry) => now - entry.timestamp < EXPIRY_TIME
//       );
//       if (filtered.length > 0) {
//         tempMessages.set(userId, filtered);
//       } else {
//         tempMessages.delete(userId);
//       }
//     });
//     console.log("清理過期消息後，tempMessages:", tempMessages);
//   }, 60 * 60 * 1000); // 每小時

//   io.on("connection", (socket) => {
//     console.log("用戶已連接:", socket.id);

//     const userId = socket.handshake.query.userId;
//     if (userId) {
//       if (!userSocketMap.has(userId)) userSocketMap.set(userId, []);
//       userSocketMap.get(userId).push(socket.id);
//       console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);

//       // 推送短期同步消息
//       if (tempMessages.has(userId)) {
//         const messages = tempMessages.get(userId).map((entry) => entry.message);
//         console.log(`推送短期同步消息給 ${userId}:`, messages);
//         socket.emit("syncMessages", messages);
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
//         createdAt: new Date().toISOString(),
//       };

//       // 儲存到臨時記憶體
//       const timestamp = Date.now();
//       if (!tempMessages.has(senderId)) tempMessages.set(senderId, []);
//       if (!tempMessages.has(receiverId)) tempMessages.set(receiverId, []);
//       tempMessages.get(senderId).push({ message, timestamp });
//       tempMessages.get(receiverId).push({ message, timestamp });

//       const receiverSocketIds = userSocketMap.get(receiverId.toString()) || [];
//       receiverSocketIds.forEach((socketId) => {
//         console.log(
//           `發送給接收者 ${receiverId} (socket: ${socketId}):`,
//           message
//         );
//         io.to(socketId).emit("receiveMessage", message);
//       });

//       const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
//       senderSocketIds.forEach((socketId) => {
//         console.log(`回傳給發送者 ${senderId} (socket: ${socketId}):`, message);
//         io.to(socketId).emit("messageSent", message);
//       });
//     });

//     socket.on("markAsRead", ({ messageId, senderId }) => {
//       console.log(`標記消息 ${messageId} 為已讀，通知發送者 ${senderId}`);
//       const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
//       senderSocketIds.forEach((socketId) => {
//         console.log(`通知發送者 ${senderId} (socket: ${socketId}) 已讀`);
//         io.to(socketId).emit("messageRead", { messageId });
//       });
//     });

//     socket.on("disconnect", () => {
//       console.log("用戶斷開連接:", socket.id);
//       if (userId && userSocketMap.has(userId)) {
//         const sockets = userSocketMap.get(userId);
//         const index = sockets.indexOf(socket.id);
//         if (index > -1) sockets.splice(index, 1);
//         if (sockets.length === 0) userSocketMap.delete(userId);
//       }
//     });
//   });

//   return io;
// }

// module.exports = { initializeWebSocket };

// websocket.js // version2

// const { Server } = require("socket.io");

// function initializeWebSocket(server) {
//   const io = new Server(server, {
//     cors: {
//       origin: "https://message-board-front.vercel.app",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   const userSocketMap = new Map(); // key: userId, value: [socketId]
//   const tempMessages = new Map(); // key: userId, value: [{ message, timestamp }]
//   const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 小時（毫秒）

//   // 定時清理過期消息
//   setInterval(() => {
//     const now = Date.now();
//     tempMessages.forEach((messages, userId) => {
//       const filtered = messages.filter(
//         (entry) => now - entry.timestamp < EXPIRY_TIME
//       );
//       if (filtered.length > 0) {
//         tempMessages.set(userId, filtered);
//       } else {
//         tempMessages.delete(userId);
//       }
//     });
//     console.log("清理過期消息後，tempMessages:", tempMessages);
//   }, 60 * 60 * 1000);

//   io.on("connection", (socket) => {
//     console.log("用戶已連接:", socket.id);

//     const userId = socket.handshake.query.userId;
//     if (userId) {
//       if (!userSocketMap.has(userId)) userSocketMap.set(userId, []);
//       userSocketMap.get(userId).push(socket.id);
//       console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);

//       if (tempMessages.has(userId)) {
//         const messages = tempMessages.get(userId).map((entry) => entry.message);
//         console.log(`推送短期同步消息給 ${userId}:`, messages);
//         socket.emit("syncMessages", messages);
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
//         isRead: receiverId === userId && userSocketMap.has(receiverId), // 接收者在線時自動標記為已讀
//         createdAt: new Date().toISOString(),
//       };

//       const timestamp = Date.now();
//       if (!tempMessages.has(senderId)) tempMessages.set(senderId, []);
//       if (!tempMessages.has(receiverId)) tempMessages.set(receiverId, []);
//       tempMessages.get(senderId).push({ message, timestamp });
//       tempMessages.get(receiverId).push({ message, timestamp });

//       const receiverSocketIds = userSocketMap.get(receiverId.toString()) || [];
//       receiverSocketIds.forEach((socketId) => {
//         console.log(
//           `發送給接收者 ${receiverId} (socket: ${socketId}):`,
//           message
//         );
//         io.to(socketId).emit("receiveMessage", message);
//       });

//       const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
//       senderSocketIds.forEach((socketId) => {
//         console.log(`回傳給發送者 ${senderId} (socket: ${socketId}):`, message);
//         io.to(socketId).emit("messageSent", message);
//       });

//       // 如果接收者在線，自動觸發已讀通知
//       if (receiverSocketIds.length > 0) {
//         console.log(
//           `接收者 ${receiverId} 在線，自動標記消息 ${messageId} 為已讀`
//         );
//         senderSocketIds.forEach((socketId) => {
//           io.to(socketId).emit("messageRead", { messageId });
//         });
//         receiverSocketIds.forEach((socketId) => {
//           io.to(socketId).emit("messageRead", { messageId });
//         });
//       }
//     });

//     socket.on("markAsRead", ({ messageId, senderId, receiverId }) => {
//       console.log(
//         `標記消息 ${messageId} 為已讀，通知發送者 ${senderId} 和接收者 ${receiverId}`
//       );

//       // 更新 tempMessages 中的消息狀態
//       tempMessages.forEach((messages, userId) => {
//         const msgEntry = messages.find(
//           (entry) => entry.message.id === messageId
//         );
//         if (msgEntry) {
//           msgEntry.message.isRead = true;
//           console.log(
//             `更新消息 ${messageId} 的 isRead 為 true 在 user ${userId} 的 tempMessages 中`
//           );
//         }
//       });

//       // 通知發送者的所有設備
//       const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
//       console.log(`發送者 ${senderId} 的活動 socket:`, senderSocketIds);
//       senderSocketIds.forEach((socketId) => {
//         console.log(`通知發送者 ${senderId} (socket: ${socketId}) 已讀`);
//         io.to(socketId).emit("messageRead", { messageId });
//       });

//       // 通知接收者的所有設備
//       const receiverSocketIds = userSocketMap.get(receiverId.toString()) || [];
//       console.log(`接收者 ${receiverId} 的活動 socket:`, receiverSocketIds);
//       receiverSocketIds.forEach((socketId) => {
//         console.log(`通知接收者 ${receiverId} (socket: ${socketId}) 已讀同步`);
//         io.to(socketId).emit("messageRead", { messageId });
//       });
//     });

//     socket.on("disconnect", () => {
//       console.log("用戶斷開連接:", socket.id);
//       if (userId && userSocketMap.has(userId)) {
//         const sockets = userSocketMap.get(userId);
//         const index = sockets.indexOf(socket.id);
//         if (index > -1) sockets.splice(index, 1);
//         if (sockets.length === 0) userSocketMap.delete(userId);
//       }
//     });
//   });

//   return io;
// }

// module.exports = { initializeWebSocket };

// websocket.js version3

// const { Server } = require("socket.io");

// function initializeWebSocket(server) {
//   const io = new Server(server, {
//     cors: {
//       origin: "https://message-board-front.vercel.app",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   const userSocketMap = new Map(); // key: userId, value: [socketId]
//   const tempMessages = new Map(); // key: userId, value: [{ message, timestamp }]
//   const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 小時（毫秒）

//   // 定時清理過期消息
//   setInterval(() => {
//     const now = Date.now();
//     tempMessages.forEach((messages, userId) => {
//       const filtered = messages.filter(
//         (entry) => now - entry.timestamp < EXPIRY_TIME
//       );
//       if (filtered.length > 0) {
//         tempMessages.set(userId, filtered);
//       } else {
//         tempMessages.delete(userId);
//       }
//     });
//     console.log("清理過期消息後，tempMessages:", tempMessages);
//   }, 60 * 60 * 1000);

//   io.on("connection", (socket) => {
//     console.log("用戶已連接:", socket.id);

//     const userId = socket.handshake.query.userId;
//     if (userId) {
//       if (!userSocketMap.has(userId)) userSocketMap.set(userId, []);
//       userSocketMap.get(userId).push(socket.id);
//       console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);

//       // 推送短期同步消息並檢查未讀消息
//       if (tempMessages.has(userId)) {
//         const messages = tempMessages.get(userId).map((entry) => entry.message);
//         console.log(`推送短期同步消息給 ${userId}:`, messages);
//         socket.emit("syncMessages", messages);

//         // 檢查未讀消息並標記為已讀
//         messages.forEach((message) => {
//           if (message.receiverId === userId && !message.isRead) {
//             console.log(`用戶 ${userId} 上線，自動標記消息 ${message.id} 為已讀`);
//             tempMessages.forEach((msgs, uid) => {
//               const msgEntry = msgs.find((entry) => entry.message.id === message.id);
//               if (msgEntry) {
//                 msgEntry.message.isRead = true;
//               }
//             });

//             const senderSocketIds = userSocketMap.get(message.senderId.toString()) || [];
//             senderSocketIds.forEach((socketId) => {
//               console.log(`通知發送者 ${message.senderId} (socket: ${socketId}) 已讀`);
//               io.to(socketId).emit("messageRead", { messageId: message.id });
//             });

//             const receiverSocketIds = userSocketMap.get(userId.toString()) || [];
//             receiverSocketIds.forEach((socketId) => {
//               console.log(`通知接收者 ${userId} (socket: ${socketId}) 已讀同步`);
//               io.to(socketId).emit("messageRead", { messageId: message.id });
//             });
//           }
//         });
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
//         isRead: userSocketMap.has(receiverId), // 接收者在線時自動標記為已讀
//         createdAt: new Date().toISOString(),
//       };

//       const timestamp = Date.now();
//       if (!tempMessages.has(senderId)) tempMessages.set(senderId, []);
//       if (!tempMessages.has(receiverId)) tempMessages.set(receiverId, []);
//       tempMessages.get(senderId).push({ message, timestamp });
//       tempMessages.get(receiverId).push({ message, timestamp });

//       const receiverSocketIds = userSocketMap.get(receiverId.toString()) || [];
//       receiverSocketIds.forEach((socketId) => {
//         console.log(`發送給接收者 ${receiverId} (socket: ${socketId}):`, message);
//         io.to(socketId).emit("receiveMessage", message);
//       });

//       const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
//       senderSocketIds.forEach((socketId) => {
//         console.log(`回傳給發送者 ${senderId} (socket: ${socketId}):`, message);
//         io.to(socketId).emit("messageSent", message);
//       });

//       // 如果接收者在線，立即觸發已讀通知
//       if (receiverSocketIds.length > 0) {
//         console.log(`接收者 ${receiverId} 在線，自動標記消息 ${messageId} 為已讀`);
//         senderSocketIds.forEach((socketId) => {
//           io.to(socketId).emit("messageRead", { messageId });
//         });
//         receiverSocketIds.forEach((socketId) => {
//           io.to(socketId).emit("messageRead", { messageId });
//         });
//       }
//     });

//     socket.on("markAsRead", ({ messageId, senderId, receiverId }) => {
//       console.log(`標記消息 ${messageId} 為已讀，通知發送者 ${senderId} 和接收者 ${receiverId}`);

//       tempMessages.forEach((messages, userId) => {
//         const msgEntry = messages.find((entry) => entry.message.id === messageId);
//         if (msgEntry) {
//           msgEntry.message.isRead = true;
//           console.log(`更新消息 ${messageId} 的 isRead 為 true 在 user ${userId} 的 tempMessages 中`);
//         }
//       });

//       const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
//       console.log(`發送者 ${senderId} 的活動 socket:`, senderSocketIds);
//       senderSocketIds.forEach((socketId) => {
//         console.log(`通知發送者 ${senderId} (socket: ${socketId}) 已讀`);
//         io.to(socketId).emit("messageRead", { messageId });
//       });

//       const receiverSocketIds = userSocketMap.get(receiverId.toString()) || [];
//       console.log(`接收者 ${receiverId} 的活動 socket:`, receiverSocketIds);
//       receiverSocketIds.forEach((socketId) => {
//         console.log(`通知接收者 ${receiverId} (socket: ${socketId}) 已讀同步`);
//         io.to(socketId).emit("messageRead", { messageId });
//       });
//     });

//     socket.on("disconnect", () => {
//       console.log("用戶斷開連接:", socket.id);
//       if (userId && userSocketMap.has(userId)) {
//         const sockets = userSocketMap.get(userId);
//         const index = sockets.indexOf(socket.id);
//         if (index > -1) sockets.splice(index, 1);
//         if (sockets.length === 0) userSocketMap.delete(userId);
//       }
//     });
//   });

//   return io;
// }

// module.exports = { initializeWebSocket };
// websocket.js version4
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

  const userSocketMap = new Map(); // key: userId, value: [socketId]
  const tempMessages = new Map(); // key: userId, value: [{ message, timestamp }]
  const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 小時（毫秒）

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
  }, 60 * 60 * 1000);

  io.on("connection", (socket) => {
    console.log("用戶已連接:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
      if (!userSocketMap.has(userId)) userSocketMap.set(userId, []);
      userSocketMap.get(userId).push(socket.id);
      console.log(`用戶 ${userId} 已綁定 socket ${socket.id}`);

      if (tempMessages.has(userId)) {
        const messages = tempMessages.get(userId).map((entry) => entry.message);
        console.log(`推送短期同步消息給 ${userId}:`, messages);
        socket.emit("syncMessages", messages);

        messages.forEach((message) => {
          if (message.receiverId === userId && !message.isRead) {
            console.log(
              `用戶 ${userId} 上線，自動標記消息 ${message.id} 為已讀`
            );
            tempMessages.forEach((msgs, uid) => {
              const msgEntry = msgs.find(
                (entry) => entry.message.id === message.id
              );
              if (msgEntry) {
                msgEntry.message.isRead = true;
              }
            });

            const senderSocketIds =
              userSocketMap.get(message.senderId.toString()) || [];
            senderSocketIds.forEach((socketId) => {
              console.log(
                `通知發送者 ${message.senderId} (socket: ${socketId}) 已讀`
              );
              io.to(socketId).emit("messageRead", { messageId: message.id });
            });

            const receiverSocketIds =
              userSocketMap.get(userId.toString()) || [];
            receiverSocketIds.forEach((socketId) => {
              console.log(
                `通知接收者 ${userId} (socket: ${socketId}) 已讀同步`
              );
              io.to(socketId).emit("messageRead", { messageId: message.id });
            });
          }
        });
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
        isRead: userSocketMap.has(receiverId),
        createdAt: new Date().toISOString(),
      };

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

      if (receiverSocketIds.length > 0) {
        console.log(
          `接收者 ${receiverId} 在線，自動標記消息 ${messageId} 為已讀`
        );
        senderSocketIds.forEach((socketId) => {
          io.to(socketId).emit("messageRead", { messageId });
        });
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("messageRead", { messageId });
        });
      }
    });

    socket.on("markAsRead", ({ messageId, senderId, receiverId }) => {
      console.log(
        `標記消息 ${messageId} 為已讀，通知發送者 ${senderId} 和接收者 ${receiverId}`
      );

      tempMessages.forEach((messages, userId) => {
        const msgEntry = messages.find(
          (entry) => entry.message.id === messageId
        );
        if (msgEntry) {
          msgEntry.message.isRead = true;
          console.log(
            `更新消息 ${messageId} 的 isRead 為 true 在 user ${userId} 的 tempMessages 中`
          );
        }
      });

      const senderSocketIds = userSocketMap.get(senderId.toString()) || [];
      console.log(`發送者 ${senderId} 的活動 socket:`, senderSocketIds);
      senderSocketIds.forEach((socketId) => {
        console.log(`通知發送者 ${senderId} (socket: ${socketId}) 已讀`);
        io.to(socketId).emit("messageRead", { messageId });
      });

      const receiverSocketIds = userSocketMap.get(receiverId.toString()) || [];
      console.log(`接收者 ${receiverId} 的活動 socket:`, receiverSocketIds);
      receiverSocketIds.forEach((socketId) => {
        console.log(`通知接收者 ${receiverId} (socket: ${socketId}) 已讀同步`);
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
