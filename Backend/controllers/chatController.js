const prisma = require("../db/db");

const chatUser = (user) => user && ({
  id: user.id,
  username: user.username,
  avatar: user.profilePicture,
  profilePicture: user.profilePicture,
});

const chatMessage = (message) => message && ({
  id: message.id,
  content: message.text,
  createdAt: message.sendAt,
  senderId: message.senderId,
  sender: chatUser(message.sender),
});

const conversationInclude = {
  participants: {
    include: {
      user: { select: { id: true, username: true, profilePicture: true } },
    },
  },
  messages: {
    orderBy: { sendAt: "desc" },
    take: 1,
    include: {
      sender: { select: { id: true, username: true, profilePicture: true } },
    },
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
          otherUser: chatUser(other),
          lastMessage: chatMessage(conv.messages[0]),
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
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, profilePicture: true } },
          },
        },
      },
    });

    if (existing) {
      const other = existing.participants.find((p) => p.userId !== req.user.id)?.user;
      if (!other) return res.status(404).json({ error: "Conversation user not found." });
      return res.json({ conversationId: existing.id, otherUser: chatUser(other) });
    }

    const otherUser = await prisma.user.findUnique({ where: { id: otherId } });
    if (!otherUser) return res.status(404).json({ error: "User not found." });

    const created = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: req.user.id }, { userId: otherId }],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, profilePicture: true } },
          },
        },
      },
    });
    return res.status(201).json({ conversationId: created.id, otherUser: chatUser(otherUser) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to start conversation." });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const member = await prisma.conversationParticipants.findFirst({
      where: { conversationId: req.params.id, userId: req.user.id },
    });
    if (!member) return res.status(403).json({ error: "Not in this conversation." });

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } },
      },
      orderBy: { sendAt: "desc" },
      take: 200,
    });

    return res.json({
      messages: messages.reverse().map(chatMessage),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load messages." });
  }
};

exports.sendMessageHttp = async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (req.file) return res.status(400).json({ error: "Image messages are not supported." });
    if (!content) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const member = await prisma.conversationParticipants.findFirst({
      where: { conversationId: req.params.id, userId: req.user.id },
    });
    if (!member) return res.status(403).json({ error: "Not in this conversation." });

    const recipient = await prisma.conversationParticipants.findFirst({
      where: { conversationId: req.params.id, userId: { not: req.user.id } },
    });
    if (!recipient) return res.status(400).json({ error: "Conversation recipient not found." });

    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        senderId: req.user.id,
        recieverId: recipient.userId,
        text: content,
      },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });

    return res.status(201).json({ message: chatMessage(message) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send message." });
  }
};
