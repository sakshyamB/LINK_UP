const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { publicUser } = require("../lib/tokens");

const onlineUsers = new Map();

const addOnline = (userId, socketId) => {
  const set = onlineUsers.get(userId) || new Set();
  set.add(socketId);
  onlineUsers.set(userId, set);
};

const removeOnline = (userId, socketId) => {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
  else onlineUsers.set(userId, set);
};

const isOnline = (userId) => onlineUsers.has(userId);

const emitToUser = (io, userId, event, payload) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.forEach((socketId) => io.to(socketId).emit(event, payload));
};

const attachSockets = (io) => {
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || "").replace("Bearer ", "");
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;
      return next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    addOnline(socket.userId, socket.id);
    io.emit("presence:update", { userId: socket.userId, online: true });

    socket.on("chat:join", (conversationId) => {
      if (conversationId) socket.join(`conv:${conversationId}`);
    });

    socket.on("chat:message", async ({ conversationId, content }) => {
      try {
        const text = (content || "").trim();
        if (!conversationId || !text) return;

        const member = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.userId,
            },
          },
        });
        if (!member) return;

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.userId,
            content: text,
          },
          include: { sender: true },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        const payload = {
          id: message.id,
          conversationId,
          content: message.content,
          imageUrl: message.imageUrl,
          createdAt: message.createdAt,
          senderId: message.senderId,
          sender: publicUser(message.sender),
        };

        io.to(`conv:${conversationId}`).emit("chat:message", payload);

        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
        });
        participants.forEach((p) => {
          if (p.userId !== socket.userId) {
            emitToUser(io, p.userId, "chat:notify", payload);
          }
        });
      } catch (error) {
        socket.emit("chat:error", { error: "Failed to send message." });
      }
    });

    socket.on("call:invite", async ({ toUserId, roomId }) => {
      if (!toUserId || !roomId) return;
      const caller = await prisma.user.findUnique({ where: { id: socket.userId } });
      emitToUser(io, toUserId, "call:incoming", {
        from: publicUser(caller),
        roomId,
      });
    });

    socket.on("call:join", (roomId) => {
      if (!roomId) return;
      socket.join(`call:${roomId}`);
      socket.to(`call:${roomId}`).emit("call:peer-ready", { from: socket.userId });
    });

    socket.on("call:signal", ({ roomId, data }) => {
      if (!roomId) return;
      socket.to(`call:${roomId}`).emit("call:signal", {
        from: socket.userId,
        data,
      });
    });

    socket.on("call:end", ({ roomId, toUserId }) => {
      if (roomId) {
        socket.to(`call:${roomId}`).emit("call:ended", { from: socket.userId });
      }
      if (toUserId) emitToUser(io, toUserId, "call:ended", { from: socket.userId });
    });

    socket.on("disconnect", () => {
      removeOnline(socket.userId, socket.id);
      if (!isOnline(socket.userId)) {
        io.emit("presence:update", { userId: socket.userId, online: false });
      }
    });
  });
};

module.exports = { attachSockets, isOnline, onlineUsers };
