import roomHandler from "./handlers/roomHandler.js";
import drawingHandler from "./handlers/drawingHandler.js";
import chatHandler from "./handlers/chatHandler.js";
import gameHandler from "./handlers/gameHandler.js";

export default function initializeSocket(io) {
    io.on("connection", (socket) => {
        // Log connection
        console.log(`Socket connected: ${socket.id}`);

        // Initialize state variables on socket instance
        socket.roomId = null;
        socket.playerId = null;

        // Register sub-handlers
        roomHandler(io, socket);
        drawingHandler(io, socket);
        chatHandler(io, socket);
        gameHandler(io, socket);

        // Global check on disconnect
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}
