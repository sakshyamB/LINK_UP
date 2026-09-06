const prisma = require("../db/db");
const { getPagination } = require("../utils/pagination");

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        message: "Search query is required.",
      });
    }

    const { page, limit, skip } = getPagination(req.query);
    const usersWhere = {
        username: {
          contains: query,
          mode: "insensitive",
        },
    };
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: usersWhere,
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
        orderBy: { username: "asc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: usersWhere }),
    ]);
   return res.status(200).json({
     message: "Users fetched successfully.",
     users,
     pagination: {
       page,
       limit,
       hasMore: skip + users.length < totalUsers,
       total: totalUsers,
     },
   });
  } catch (error) {
    return res.status(500).json({ error: "Search failed." });
  }
};
