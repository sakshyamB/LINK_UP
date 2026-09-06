const prisma = require("../db/db");
const { getPagination } = require("../utils/pagination");

exports.createPost = async (req, res) => {
  try {
    const post = await prisma.post.create({
      data: {
        authorId: req.user.id,
        caption: req.body.caption,
        imageUrl: req.body.imageUrl,
      },
    });

    return res.status(201).json({message: "Post created successfully",post,});
 
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create post.",
    });
  }
};


exports.getuserPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = getPagination(req.query);

    const [userPost, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: req.params.id,
        },
        include: {
          author: {
            select: {
              username: true,
              profilePicture: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.post.count({ where: { authorId: req.params.id } }),
    ]);

    const likedPosts = await prisma.like.findMany({
      where: {
        likedById: userId,
        postId: {
          in: userPost.map((post) => post.id),
        },
      },
      select: {
        postId: true,
      },
    });

    const likedPostIds = new Set(
      likedPosts.map((like) => like.postId)
    );

    const postsWithLikeStatus = userPost.map((post) => ({
      ...post,
      isLikedByMe: likedPostIds.has(post.id),
    }));

    return res.status(200).json({
      message: "Users Post are fetched successfully",
      userPost: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        hasMore: skip + userPost.length < totalPosts,
        total: totalPosts,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Couldn't find user's posts",
      error: error.message,
    });
  }
};

exports.getAllpost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = getPagination(req.query);

    const [AllPost, totalPosts] = await Promise.all([
      prisma.post.findMany({
        include: {
          author: {
            select: {
              username: true,
              profilePicture: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.post.count(),
    ]);

    const likedPosts = await prisma.like.findMany({
      where: {
        likedById: userId,
        postId: {
          in: AllPost.map((post) => post.id),
        },
      },
      select: {
        postId: true,
      },
    });

    const likedPostIds = new Set(
      likedPosts.map((like) => like.postId)
    );

    const postsWithLikeStatus = AllPost.map((post) => ({
      ...post,
      isLikedByMe: likedPostIds.has(post.id),
    }));

    return res.status(200).json({
      message: "All posts are fetched.",
      AllPost: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        hasMore: skip + AllPost.length < totalPosts,
        total: totalPosts,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Couldn't fetch all post.",
      error: error.message,
    });
  }
};

exports.getSinglePost = async (req, res) => {
  try {
    const userId = req.user.id;

    const singlePost = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
      include: {
        author: {
          select: {
            username: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!singlePost) {
      return res.status(404).json({
        message: "The post doesn't exist.",
      });
    }

    const like = await prisma.like.findUnique({
      where: {
        likedById_postId: {
          likedById: userId,
          postId: req.params.postId,
        },
      },
    });

    const isLikedByMe = !!like;

    return res.status(200).json({
      message: "Single post fetched successfully",
      singlePost,
      isLikedByMe,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Couldn't fetch single post",
      error: error.message,
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "The post doesn't exist.",
      });
    }

    const { caption, imageUrl } = req.body;
    const postId = req.params.postId;

    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to update this post.",
      });
    }

    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        caption,
        imageUrl,
      },
    });

    return res.status(200).json({
      message: "Post updated successfully",
      updatedPost,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to update post.",
      error: error.message,
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "The post doesn't exist.",
      });
    }

    if (req.user.id !== post.authorId) {
      return res.status(403).json({
        message: "You are not authorized to delete this post.",
      });
    }

    const deletedpost = await prisma.post.delete({
      where: {
        id: req.params.postId,
      },
    });

    return res.status(200).json({
      message: "Post deleted successfully",
      deletedpost,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error deleting post",
      error: error.message,
    });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = getPagination(req.query);

    const friends = await prisma.friendRequest.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: userId },
          { recieverId: userId },
        ],
      },
    });

    const friendIds = friends.map((friendship) => {
      if (friendship.requesterId === userId) {
        return friendship.recieverId;
      } else {
        return friendship.requesterId;
      }
    });

    const feedWhere = {
      authorId: {
        in: friendIds,
      },
    };

    const [feed, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: feedWhere,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.post.count({ where: feedWhere }),
    ]);

    const likedPosts = await prisma.like.findMany({
      where: {
        likedById: userId,
        postId: {
          in: feed.map((post) => post.id),
        },
      },
      select: {
        postId: true,
      },
    });

    const likedPostIds = new Set(
      likedPosts.map((like) => like.postId)
    );

    const feedWithLikeStatus = feed.map((post) => ({
      ...post,
      isLikedByMe: likedPostIds.has(post.id),
    }));

    return res.status(200).json({
      message: "Feed fetched successfully",
      feed: feedWithLikeStatus,
      pagination: {
        page,
        limit,
        hasMore: skip + feed.length < totalPosts,
        total: totalPosts,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching feed",
      error: error.message,
    });
  }
};
