const prisma = require("../lib/prisma");

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        message: "Search query is required.",
      });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
      },
    });
   return res.status(200).json({ message: "Users fetched successfully.",users});
  } catch (error) {
    return res.status(500).json({ error: "Search failed." });
  }
};
