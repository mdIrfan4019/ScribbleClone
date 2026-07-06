import Player from "../../classes/Player.js";
import gameManager from "../../classes/GameManager.js";
import { startWordSelection } from "./gameHandler.js";

export default function roomHandler(io, socket) {
    // 1. Host creates a room
    socket.on("create_room", ({ hostName, settings }) => {
        try {
            if (!hostName || hostName.trim() === "") {
                return socket.emit("error", { message: "Username is required." });
            }

            const hostPlayer = new Player(socket.id, hostName);
            const room = gameManager.createRoom(hostPlayer, settings);

            socket.playerId = hostPlayer.playerId;
            socket.roomId = room.roomId;

            socket.join(room.roomId);

            socket.emit("room_created", {
                roomId: room.roomId,
                playerId: hostPlayer.playerId,
                room: room.toJSON()
            });

            console.log(`Room created: ${room.roomId} by ${hostName}`);
        } catch (error) {
            console.error("Create Room Error:", error);
            socket.emit("error", { message: error.message || "Failed to create room." });
        }
    });

    // 2. Player joins a room
    socket.on("join_room", ({ roomId, playerName }) => {
        try {
            if (!roomId || !playerName || playerName.trim() === "") {
                return socket.emit("error", { message: "Room code and username are required." });
            }

            const cleanRoomId = roomId.trim().toUpperCase();
            const room = gameManager.getRoom(cleanRoomId);

            if (!room) {
                return socket.emit("error", { message: "Room not found." });
            }

            if (room.isFull()) {
                return socket.emit("error", { message: "Room is full." });
            }

            if (room.type !== "PUBLIC" && room.isGameRunning()) {
                return socket.emit("error", { message: "Game has already started." });
            }

            // Check if username is already taken in this room
            const nameExists = room.getPlayers().some(
                p => p.username.toLowerCase() === playerName.trim().toLowerCase()
            );
            if (nameExists) {
                return socket.emit("error", { message: "Username is already taken in this room." });
            }

            const newPlayer = new Player(socket.id, playerName);
            room.addPlayer(newPlayer);

            socket.playerId = newPlayer.playerId;
            socket.roomId = room.roomId;

            socket.join(room.roomId);

            // Notify joining player
            socket.emit("room_joined", {
                roomId: room.roomId,
                playerId: newPlayer.playerId,
                room: room.toJSON()
            });

            // Notify everyone else in the room
            socket.to(room.roomId).emit("player_joined", {
                player: newPlayer.toJSON(),
                players: room.getPlayers().map(p => p.toJSON())
            });

            console.log(`Player ${playerName} joined room ${room.roomId}`);

            // Matchmaker Auto-Start for Public Rooms
            if (room.type === "PUBLIC" && room.state === "LOBBY" && room.getPlayerCount() >= 2) {
                console.log(`Auto-starting public room ${room.roomId} matchmaking`);
                room.startGame();
                io.to(room.roomId).emit("game_started", { room: room.toJSON() });
                startWordSelection(room, io);
            }
        } catch (error) {
            console.error("Join Room Error:", error);
            socket.emit("error", { message: error.message || "Failed to join room." });
        }
    });

    // 2b. Matchmaker: Join or Create a Public Room
    socket.on("join_public_room", ({ playerName }) => {
        try {
            if (!playerName || playerName.trim() === "") {
                return socket.emit("error", { message: "Username is required." });
            }

            // Find an active public room that has space and is in LOBBY state
            let room = gameManager.findPublicRoom();

            if (room) {
                // Check if username is already taken in this room
                const nameExists = room.getPlayers().some(
                    p => p.username.toLowerCase() === playerName.trim().toLowerCase()
                );
                // Unique name resolution for public matchmaking
                let uniqueName = playerName.trim();
                if (nameExists) {
                    uniqueName = `${playerName.trim()}${Math.floor(Math.random() * 10)}`;
                }

                const newPlayer = new Player(socket.id, uniqueName);
                room.addPlayer(newPlayer);

                socket.playerId = newPlayer.playerId;
                socket.roomId = room.roomId;
                socket.join(room.roomId);

                socket.emit("room_joined", {
                    roomId: room.roomId,
                    playerId: newPlayer.playerId,
                    room: room.toJSON()
                });

                socket.to(room.roomId).emit("player_joined", {
                    player: newPlayer.toJSON(),
                    players: room.getPlayers().map(p => p.toJSON())
                });

                console.log(`Matchmaker: Joined Player ${uniqueName} to Public Room ${room.roomId}`);

                // Matchmaker Auto-Start for Public Rooms
                if (room.state === "LOBBY" && room.getPlayerCount() >= 2) {
                    console.log(`Auto-starting public room ${room.roomId} matchmaking`);
                    room.startGame();
                    io.to(room.roomId).emit("game_started", { room: room.toJSON() });
                    startWordSelection(room, io);
                }
            } else {
                // No public room available, spawn a new public room for them!
                const hostPlayer = new Player(socket.id, playerName);
                room = gameManager.createRoom(hostPlayer, {
                    type: "PUBLIC",
                    maxPlayers: 12,
                    rounds: 3,
                    drawTime: 60,
                    hints: true,
                    wordMode: "NORMAL"
                });

                socket.playerId = hostPlayer.playerId;
                socket.roomId = room.roomId;
                socket.join(room.roomId);

                socket.emit("room_created", {
                    roomId: room.roomId,
                    playerId: hostPlayer.playerId,
                    room: room.toJSON()
                });

                console.log(`Matchmaker: Spawned new Public Room ${room.roomId} for ${playerName}`);
            }
        } catch (error) {
            console.error("Matchmaker Error:", error);
            socket.emit("error", { message: error.message || "Matchmaking failed." });
        }
    });

    // 3. Player toggles ready status
    socket.on("toggle_ready", () => {
        try {
            const { roomId, playerId } = socket;
            if (!roomId || !playerId) return;

            const room = gameManager.getRoom(roomId);
            if (!room) return;

            const player = room.getPlayer(playerId);
            if (!player) return;

            if (player.isReady) {
                player.setNotReady();
            } else {
                player.setReady();
            }

            io.to(room.roomId).emit("room_state", { room: room.toJSON() });
        } catch (error) {
            console.error("Toggle Ready Error:", error);
        }
    });

    // 4. Update room settings
    socket.on("update_settings", ({ settings }) => {
        try {
            const { roomId, playerId } = socket;
            if (!roomId || !playerId) return;

            const room = gameManager.getRoom(roomId);
            if (!room) return;

            // Only host can update settings
            if (room.host?.playerId !== playerId) {
                return socket.emit("error", { message: "Only the host can change settings." });
            }

            room.updateSettings(settings);

            io.to(room.roomId).emit("settings_updated", {
                settings: room.settings,
                room: room.toJSON()
            });
        } catch (error) {
            console.error("Update Settings Error:", error);
        }
    });

    // 5. Host starts game
    socket.on("start_game", () => {
        try {
            const { roomId, playerId } = socket;
            if (!roomId || !playerId) return;

            const room = gameManager.getRoom(roomId);
            if (!room) return;

            // Only host can start
            if (room.host?.playerId !== playerId) {
                return socket.emit("error", { message: "Only the host can start the game." });
            }

            if (room.getPlayerCount() < 2) {
                return socket.emit("error", { message: "At least 2 players are required to start." });
            }

            // Start game logic
            room.startGame(); // Starts round 1 and puts state to WORD_SELECTION
            io.to(room.roomId).emit("game_started", { room: room.toJSON() });

            // Trigger word selection phase
            startWordSelection(room, io);
        } catch (error) {
            console.error("Start Game Error:", error);
            socket.emit("error", { message: error.message || "Failed to start game." });
        }
    });

    // 6. Handle client disconnect / leave room
    socket.on("leave_room", () => {
        handlePlayerDeparture(io, socket);
    });

    socket.on("disconnect", () => {
        handlePlayerDeparture(io, socket);
    });
}

function handlePlayerDeparture(io, socket) {
    try {
        const { roomId, playerId } = socket;
        if (!roomId || !playerId) return;

        const room = gameManager.getRoom(roomId);
        if (!room) return;

        const player = room.getPlayer(playerId);
        if (!player) return;

        const username = player.username;
        const wasHost = player.isHost;
        const wasDrawer = player.isDrawer;

        // Leave room
        gameManager.leaveRoom(roomId, playerId);
        socket.leave(roomId);

        // Reset socket variables
        socket.roomId = null;
        socket.playerId = null;

        // If room still exists, notify others
        const updatedRoom = gameManager.getRoom(roomId);
        if (updatedRoom) {
            io.to(roomId).emit("player_left", {
                playerId,
                username,
                room: updatedRoom.toJSON()
            });

            // If the drawer left during drawing phase, we need to end the round immediately
            if (wasDrawer && updatedRoom.state === "DRAWING") {
                io.to(roomId).emit("chat_message", {
                    system: true,
                    text: `The drawer ${username} has left. Ending round.`
                });
                // End round via game handler (we'll implement handleRoundEnd in gameHandler.js)
                import("./gameHandler.js").then(({ handleRoundEnd }) => {
                    handleRoundEnd(updatedRoom, io, "Drawer left");
                });
            } else if (updatedRoom.state === "WORD_SELECTION" && wasDrawer) {
                // If drawer left during word selection
                io.to(roomId).emit("chat_message", {
                    system: true,
                    text: `The drawer ${username} left during word selection. Retrying round.`
                });
                import("./gameHandler.js").then(({ handleRoundEnd }) => {
                    handleRoundEnd(updatedRoom, io, "Drawer left during selection");
                });
            }
        }

        console.log(`Player ${username} left room ${roomId}`);
    } catch (error) {
        console.error("Handle Departure Error:", error);
    }
}
