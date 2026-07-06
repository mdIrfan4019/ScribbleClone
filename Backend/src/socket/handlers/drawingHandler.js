import gameManager from "../../classes/GameManager.js";
import { GAME_STATES } from "../../constants/gameStates.js";

export default function drawingHandler(io, socket) {
    // Helper to validate if the player is allowed to draw
    const validateDrawer = () => {
        const { roomId, playerId } = socket;
        if (!roomId || !playerId) return null;

        const room = gameManager.getRoom(roomId);
        if (!room) return null;

        // Must be in DRAWING phase
        if (room.state !== GAME_STATES.DRAWING) return null;

        // Must be the current drawer
        if (!room.canDraw(playerId)) return null;

        return room;
    };

    // 1. Drawer starts a stroke
    socket.on("draw_start", ({ x, y, color, size, tool }) => {
        try {
            const room = validateDrawer();
            if (!room) return;

            // Start stroke on backend canvas
            room.canvas.startStroke({ tool, color, size, x, y });

            // Broadcast to other clients (and drawer for synchronization)
            io.to(room.roomId).emit("draw_start", {
                x,
                y,
                color,
                size,
                tool,
                playerId: socket.playerId
            });
        } catch (error) {
            console.error("Draw Start Error:", error);
        }
    });

    // 2. Drawer moves/draws
    socket.on("draw_move", ({ x, y }) => {
        try {
            const room = validateDrawer();
            if (!room) return;

            // Add point on backend canvas
            room.canvas.addPoint(x, y);

            // Broadcast move event
            io.to(room.roomId).emit("draw_move", { x, y });
        } catch (error) {
            console.error("Draw Move Error:", error);
        }
    });

    // 3. Drawer ends a stroke
    socket.on("draw_end", () => {
        try {
            const room = validateDrawer();
            if (!room) return;

            // End stroke on backend canvas
            room.canvas.endStroke();

            // Broadcast end event
            io.to(room.roomId).emit("draw_end");
        } catch (error) {
            console.error("Draw End Error:", error);
        }
    });

    // 4. Drawer or Host clears the canvas
    socket.on("canvas_clear", () => {
        try {
            const { roomId, playerId } = socket;
            if (!roomId || !playerId) return;

            const room = gameManager.getRoom(roomId);
            if (!room) return;

            // Drawer or Host can clear canvas
            const isDrawer = room.canDraw(playerId);
            const isHost = room.host?.playerId === playerId;

            if (!isDrawer && !isHost) return;

            // Clear backend canvas
            room.canvas.clear();

            // Broadcast clear event to everyone
            io.to(room.roomId).emit("canvas_clear");
        } catch (error) {
            console.error("Canvas Clear Error:", error);
        }
    });

    // 5. Drawer undos the last stroke
    socket.on("draw_undo", () => {
        try {
            const room = validateDrawer();
            if (!room) return;

            // Undo stroke on backend canvas
            room.canvas.undo();

            // Broadcast undo event to everyone
            io.to(room.roomId).emit("draw_undo");
        } catch (error) {
            console.error("Draw Undo Error:", error);
        }
    });
}
