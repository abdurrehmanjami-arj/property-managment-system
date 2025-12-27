const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "EstatePro API is running" });
});

// Make io accessible to routes
app.set("io", io);

// Socket.IO connection handling
const userSockets = new Map(); // Map userId to socket IDs

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("authenticate", (userId) => {
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`✅ User ${userId} authenticated with socket ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    // Remove socket from all users
    for (const [userId, sockets] of userSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    }
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Export function to emit events to specific users
global.emitToUser = (userId, event, data) => {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
    console.log(`📤 Emitted ${event} to user ${userId}`);
  }
};

// Global broadcast to all connected clients
global.broadcast = (event, data) => {
  io.emit(event, data);
  console.log(`📡 Broadcasted ${event}`);
};

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Successfully!"))
  .catch((err) => {
    console.error("❌ MONGODB CONNECTION ERROR!");
    console.error(
      "Please make sure MongoDB is installed and RUNNING on your computer."
    );
    console.error("Error Details:", err.message);
  });

app.use("/api/auth", require("./routes/auth"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/rents", require("./routes/rents"));
app.use("/api/backup", require("./routes/backup"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
