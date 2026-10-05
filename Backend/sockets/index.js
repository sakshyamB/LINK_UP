const jwt = require("jsonwebtoken");
const prisma = require("../db/db");

const chatUser = (user) => user && ({
  id: user.id,
  username: user.username,
  avatar: user.profilePicture,
  profilePicture: user.profilePicture,
});

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
    socket.emit("presence:sync", [...onlineUsers.keys()]);
    io.emit("presence:update", { userId: socket.userId, online: true });

    socket.on("chat:join", async (conversationId, acknowledge) => {
      if (!conversationId) {
        acknowledge?.({ ok: false, error: "Conversation is required." });
        return;
      }

      try {
        const member = await prisma.conversationParticipants.findFirst({
          where: { conversationId, userId: socket.userId },
        });
        if (!member) {
          acknowledge?.({ ok: false, error: "You are not part of this conversation." });
          return;
        }

        socket.join(`conv:${conversationId}`);
        acknowledge?.({ ok: true });
      } catch (error) {
        acknowledge?.({ ok: false, error: "Unable to join conversation." });
      }
    });

    socket.on("chat:message", async ({ conversationId, content, clientMessageId }, acknowledge) => {
      try {
        const text = (content || "").trim();
        if (!conversationId || !text) {
          acknowledge?.({ ok: false, error: "Message cannot be empty." });
          return;
        }

        const participants = await prisma.conversationParticipants.findMany({
          where: { conversationId },
          select: { userId: true },
        });
        const member = participants.find((participant) => participant.userId === socket.userId);
        if (!member) {
          acknowledge?.({ ok: false, error: "You are not part of this conversation." });
          return;
        }

        const recipient = participants.find((participant) => participant.userId !== socket.userId);
        if (!recipient) {
          acknowledge?.({ ok: false, error: "Conversation recipient not found." });
          return;
        }

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.userId,
            recieverId: recipient.userId,
            text,
          },
          include: {
            sender: {
              select: { id: true, username: true, profilePicture: true },
            },
          },
        });

        prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }).catch((error) => console.error("Failed to update conversation timestamp:", error.message));

        const payload = {
          id: message.id,
          conversationId,
          clientMessageId,
          content: message.text,
          createdAt: message.sendAt,
          senderId: message.senderId,
          sender: chatUser(message.sender),
        };

        io.to(`conv:${conversationId}`).emit("chat:message", payload);
        acknowledge?.({ ok: true, message: payload });
        participants.forEach((p) => {
          if (p.userId !== socket.userId) {
            emitToUser(io, p.userId, "chat:notify", payload);
          }
        });
      } catch (error) {
        acknowledge?.({ ok: false, error: "Failed to send message." });
        socket.emit("chat:error", { error: "Failed to send message." });
      }
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
