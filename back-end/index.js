require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const mainRouter = require("./routes/index.route");
require("./config/cloudinary");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { setSocketInstance } = require("./config/socket");

const defaultCorsOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "https://vercel.com/pegas-projects-be8fc807/med-track-jgt2"

];

const extraOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [...defaultCorsOrigins, ...extraOrigins];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
};

const app = express();
const server = http.createServer(app);

// DB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", mainRouter);

// 🔥 SOCKET.IO SETUP (UPDATED)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// store globally (you already use this 👍)
setSocketInstance(io);
app.set("io", io);

// 🔥 SOCKET EVENTS
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ JOIN ORDER ROOM (for payment tracking)
  socket.on("joinOrderRoom", (orderId) => {
    console.log(`User joined room: ${orderId}`);
    socket.join(orderId);
  });

  // (Optional) leave room
  socket.on("leaveOrderRoom", (orderId) => {
    socket.leave(orderId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;