const prisma = require("../lib/prisma");
const { publicUser } = require("../lib/tokens");
const { uploadBuffer, isConfigured } = require("../lib/cloudinary");

exports.searchUsers = async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ users: [] });

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
        NOT: { id: req.user.id },
      },
      take: 12,
    });
    return res.json({ users: users.map(publicUser) });
  } catch (error) {
    return res.status(500).json({ error: "Search failed." });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: "User not found." });

    const [postsCount, friendsCount] = await Promise.all([
      prisma.post.count({ where: { authorId: user.id } }),
      prisma.friendship.count({
        where: {
          status: "ACCEPTED",
          OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        },
      }),
    ]);

    let friendship = null;
    if (req.user.id !== user.id) {
      friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: req.user.id, addresseeId: user.id },
            { requesterId: user.id, addresseeId: req.user.id },
          ],
        },
      });
    }

    return res.json({
      user: { ...publicUser(user), postsCount, friendsCount },
      friendship,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load user." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = {};
    if (req.body.username) data.username = req.body.username.trim();
    if (req.body.bio !== undefined) data.bio = req.body.bio;
    if (req.body.phone !== undefined) data.phone = req.body.phone;

    if (req.files?.avatar?.[0]) {
      if (!isConfigured()) {
        return res.status(500).json({ error: "Cloudinary is not configured." });
      }
      const uploaded = await uploadBuffer(req.files.avatar[0].buffer, "socialapp/avatars");
      data.avatar = uploaded.secure_url;
    }
    if (req.files?.cover?.[0]) {
      if (!isConfigured()) {
        return res.status(500).json({ error: "Cloudinary is not configured." });
      }
      const uploaded = await uploadBuffer(req.files.cover[0].buffer, "socialapp/covers");
      data.coverPicture = uploaded.secure_url;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update profile." });
  }
};

exports.notifications = async (req, res) => {
  try {
    const items = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return res.json({ notifications: items });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load notifications." });
  }
};

exports.markNotificationsRead = async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  return res.json({ ok: true });
};
