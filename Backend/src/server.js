import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import initializeSocket from "./socket/index.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for the assignment ease of testing
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000, // Timeout connection after 60s of inactivity
    pingInterval: 25000
});

// Setup socket events handler
initializeSocket(io);

// Start Server
server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
});

// Global exception and rejection safeguards to prevent node process crashes
process.on("uncaughtException", (error) => {
    console.error("CRITICAL: Uncaught Exception caught:", error);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("CRITICAL: Unhandled Promise Rejection at:", promise, "reason:", reason);
});
