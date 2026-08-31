const prisma = require("../db/db");

exports.Myprofile = async (req, res) => {
  try {
    const ProfileInfo = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        coverPicture: true,
        dateofBirth: true,
        gender: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: "Profile fetched successfully.",
      ProfileInfo,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching the profile.",
      error: error.message,
    });
  }
};


exports.UserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        username: true,
        profilePicture: true,
        coverPicture: true,
        dateofBirth: true,
        gender: true,
        createdAt: true,

        posts: {
          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            caption: true,
            imageUrl: true,
            createdAt: true,
            updatedAt: true,

            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },

        sentRequests: {
          where: {
            status: "ACCEPTED",
          },

          select: {
            id: true,

            reciever: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },

        recievedRequests: {
          where: {
            status: "ACCEPTED",
          },

          select: {
            id: true,

            requester: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const sentFriends = user.sentRequests.map(
      (request) => request.reciever
    );

    const recievedFriends = user.recievedRequests.map(
      (request) => request.requester
    );

    const friends = [...sentFriends, ...recievedFriends];

    const friendCount = friends.length;

    return res.status(200).json({
      message: "Profile fetched successfully.",
      profile: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
        coverPicture: user.coverPicture,
        dateofBirth: user.dateofBirth,
        gender: user.gender,
        createdAt: user.createdAt,

        friendCount,
        friends,

        postCount: user.posts.length,
        posts: user.posts,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user profile.",
      error: error.message,
    });
  }
};


exports.UpdateProfile = async (req, res) => {
  try {
    const UpdatedProfile = await prisma.user.update({
      where: {
        id: req.user.id,
      },

      data: {
        username: req.body.username,
        profilePicture: req.body.profilePicture,
        coverPicture: req.body.coverPicture,
        dateofBirth: req.body.dateofBirth,
        gender: req.body.gender,
      },

      select: {
        id: true,
        username: true,
        profilePicture: true,
        coverPicture: true,
        dateofBirth: true,
        gender: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully.",
      UpdatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Couldn't update profile.",
      error: error.message,
    });
  }
};