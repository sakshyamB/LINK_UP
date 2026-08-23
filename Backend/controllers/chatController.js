const prisma = require("../lib/prisma");
const { publicUser } = require("../lib/tokens");
const { uploadBuffer, isConfigured } = require("../lib/cloudinary");

const conversationInclude = {
  participants: { include: { user: true } },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    include: { sender: true },
  },
};

exports.listConversations = async (req, res) => {
  try {
    const items = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: conversationInclude,
      orderBy: { updatedAt: "desc" },
    });

    return res.json({
      conversations: items.map((conv) => {
        const other = conv.participants.find((p) => p.userId !== req.user.id)?.user;
        return {
          id: conv.id,
          otherUser: other ? publicUser(other) : null,
          lastMessage: conv.messages[0] || null,
          updatedAt: conv.updatedAt,
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load conversations." });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  const otherId = req.params.userId;
  if (otherId === req.user.id) {
    return res.status(400).json({ error: "Cannot chat with yourself." });
  }

  try {
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: req.user.id } } },
          { participants: { some: { userId: otherId } } },
        ],
      },
      include: { participants: { include: { user: true } } },
    });

    if (existing) {
      const other = existing.participants.find((p) => p.userId !== req.user.id)?.user;
      return res.json({ conversationId: existing.id, otherUser: publicUser(other) });
    }

    const created = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: req.user.id }, { userId: otherId }],
        },
      },
      include: { participants: { include: { user: true } } },
    });
    const other = created.participants.find((p) => p.userId !== req.user.id)?.user;
    return res.status(201).json({ conversationId: created.id, otherUser: publicUser(other) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to start conversation." });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const member = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: req.params.id,
          userId: req.user.id,
        },
      },
    });
    if (!member) return res.status(403).json({ error: "Not in this conversation." });

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      include: { sender: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return res.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        imageUrl: msg.imageUrl,
        createdAt: msg.createdAt,
        senderId: msg.senderId,
        sender: publicUser(msg.sender),
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load messages." });
  }
};

exports.sendMessageHttp = async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    let imageUrl = null;
    if (req.file) {
      if (!isConfigured()) {
        return res.status(500).json({ error: "Cloudinary is not configured." });
      }
      const uploaded = await uploadBuffer(req.file.buffer, "socialapp/chat");
      imageUrl = uploaded.secure_url;
    }
    if (!content && !imageUrl) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const member = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: req.params.id,
          userId: req.user.id,
        },
      },
    });
    if (!member) return res.status(403).json({ error: "Not in this conversation." });

    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        senderId: req.user.id,
        content: content || "",
        imageUrl,
      },
      include: { sender: true },
    });

    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });

    return res.status(201).json({
      message: {
        id: message.id,
        content: message.content,
        imageUrl: message.imageUrl,
        createdAt: message.createdAt,
        senderId: message.senderId,
        sender: publicUser(message.sender),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send message." });
  }
};
