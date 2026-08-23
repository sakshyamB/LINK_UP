const prisma = require("../lib/prisma");
const { uploadBuffer, isConfigured } = require("../lib/cloudinary");
const { publicUser } = require("../lib/tokens");

const shapePost = (post, currentUserId) => ({
  id: post.id,
  caption: post.caption,
  imageUrl: post.imageUrl,
  createdAt: post.createdAt,
  likes: post._count?.likes ?? post.likes?.length ?? 0,
  liked: currentUserId
    ? (post.likes || []).some((like) => like.userId === currentUserId)
    : false,
  comments: (post.comments || []).map((comment) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    user: comment.user ? publicUser(comment.user) : null,
  })),
  author: post.author ? publicUser(post.author) : null,
});

const postInclude = {
  author: true,
  likes: true,
  comments: {
    include: { user: true },
    orderBy: { createdAt: "asc" },
  },
  _count: { select: { likes: true } },
};

exports.listPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: postInclude,
      take: 50,
    });
    return res.json({ posts: posts.map((post) => shapePost(post, req.user?.id)) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load posts." });
  }
};

exports.createPost = async (req, res) => {
  try {
    const caption = (req.body.caption || "").trim();
    let imageUrl = null;

    if (req.file) {
      if (!isConfigured()) {
        return res.status(500).json({
          error: "Cloudinary is not configured. Add CLOUDINARY_* keys in Backend/.env.",
        });
      }
      const uploaded = await uploadBuffer(req.file.buffer, "socialapp/posts");
      imageUrl = uploaded.secure_url;
    }

    if (!caption && !imageUrl) {
      return res.status(400).json({ error: "Caption or image is required." });
    }

    const post = await prisma.post.create({
      data: {
        caption: caption || null,
        imageUrl,
        authorId: req.user.id,
      },
      include: postInclude,
    });

    return res.status(201).json({ post: shapePost(post, req.user.id) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create post." });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user.id, postId: id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
    } else {
      await prisma.like.create({ data: { userId: req.user.id, postId: id } });
      const post = await prisma.post.findUnique({ where: { id } });
      if (post && post.authorId !== req.user.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "LIKE",
            message: `${req.user.username} liked your post.`,
            link: `/`,
          },
        });
      }
    }

    const likes = await prisma.like.count({ where: { postId: id } });
    return res.json({ liked: !existing, likes });
  } catch (error) {
    return res.status(500).json({ error: "Failed to like post." });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Comment cannot be empty." });

    const comment = await prisma.comment.create({
      data: { text, userId: req.user.id, postId: id },
      include: { user: true },
    });

    const post = await prisma.post.findUnique({ where: { id } });
    if (post && post.authorId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "COMMENT",
          message: `${req.user.username} commented on your post.`,
          link: `/`,
        },
      });
    }

    return res.status(201).json({
      comment: {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        user: publicUser(comment.user),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add comment." });
  }
};

exports.userPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { authorId: req.params.userId },
      orderBy: { createdAt: "desc" },
      include: postInclude,
    });
    return res.json({ posts: posts.map((post) => shapePost(post, req.user?.id)) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load posts." });
  }
};
