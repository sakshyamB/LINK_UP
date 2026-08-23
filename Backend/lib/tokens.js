const jwt = require("jsonwebtoken");

const signToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  bio: user.bio,
  avatar: user.avatar,
  coverPicture: user.coverPicture,
  createdAt: user.createdAt,
});

module.exports = { signToken, publicUser };
