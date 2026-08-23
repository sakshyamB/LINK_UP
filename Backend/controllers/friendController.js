const prisma = require("../lib/prisma");
const { publicUser } = require("../lib/tokens");

const otherUser = (friendship, meId) =>
  friendship.requesterId === meId ? friendship.addressee : friendship.requester;

exports.sendRequest = async (req, res) => {
  const addresseeId = req.params.userId;
  if (addresseeId === req.user.id) {
    return res.status(400).json({ error: "You cannot add yourself." });
  }

  try {
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user.id, addresseeId },
          { requesterId: addresseeId, addresseeId: req.user.id },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ error: "A friendship already exists.", friendship: existing });
    }

    const friendship = await prisma.friendship.create({
      data: { requesterId: req.user.id, addresseeId },
    });

    await prisma.notification.create({
      data: {
        userId: addresseeId,
        type: "FRIEND_REQUEST",
        message: `${req.user.username} sent you a friend request.`,
        link: `/profile/${req.user.id}`,
      },
    });

    return res.status(201).json({ friendship });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send request." });
  }
};

exports.respondRequest = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship || friendship.addresseeId !== req.user.id) {
      return res.status(404).json({ error: "Request not found." });
    }

    const status = action === "accept" ? "ACCEPTED" : "REJECTED";
    const updated = await prisma.friendship.update({
      where: { id },
      data: { status },
    });

    if (status === "ACCEPTED") {
      await prisma.notification.create({
        data: {
          userId: friendship.requesterId,
          type: "FRIEND_ACCEPT",
          message: `${req.user.username} accepted your friend request.`,
          link: `/profile/${req.user.id}`,
        },
      });
    }

    return res.json({ friendship: updated });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update request." });
  }
};

exports.listFriends = async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: req.user.id }, { addresseeId: req.user.id }],
      },
      include: { requester: true, addressee: true },
    });
    return res.json({
      friends: friendships.map((item) => publicUser(otherUser(item, req.user.id))),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load friends." });
  }
};

exports.pendingRequests = async (req, res) => {
  try {
    const incoming = await prisma.friendship.findMany({
      where: { addresseeId: req.user.id, status: "PENDING" },
      include: { requester: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({
      requests: incoming.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        user: publicUser(item.requester),
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load requests." });
  }
};
