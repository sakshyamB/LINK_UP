const express = require("express");
const cors = require("cors");
const prisma = require("./db/db");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/post', postRoutes);
app.use('/comment', commentRoutes);
app.use('/like', likeRoutes);
app.use('/notification', notificationRoutes);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("NeonDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Couldn't connect to NeonDB:", error);
  }
};

startServer();