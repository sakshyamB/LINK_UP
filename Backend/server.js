require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const prisma = require("./lib/prisma");
const { attachSockets } = require("./sockets");

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

attachSockets(io);

const start = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected via Prisma.");
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
