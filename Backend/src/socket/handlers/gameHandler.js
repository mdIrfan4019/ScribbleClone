import { GAME_STATES } from "../../constants/gameStates.js";
import gameManager from "../../classes/GameManager.js";
import { SCORE } from "../../constants/scoreConstants.js";

// Map to store active selection timeouts per room
const selectionTimeouts = new Map();

/**
 * Initiates the word selection phase for the drawer.
 */
export function startWordSelection(room, io) {
    try {
        const drawer = room.getCurrentDrawer();
        if (!drawer) return;

        console.log(`Starting word selection in Room ${room.roomId}. Drawer: ${drawer.username}`);

        // Ensure drawing is stopped and room state is WORD_SELECTION
        room.changeState(GAME_STATES.WORD_SELECTION);
        room.resetRound();
        room.generateWordOptions();

        // Broadcast current room state to everyone
        io.to(room.roomId).emit("room_state", { room: room.toJSON() });

        // Specifically handle round_start emissions to prevent race conditions
        const drawerSocket = io.sockets.sockets.get(drawer.socketId);
        if (drawerSocket) {
            // Send round_start to all guessers in the room (canvas clears for everyone else)
            drawerSocket.to(room.roomId).emit("round_start", {
                drawerId: drawer.playerId,
                drawTime: room.settings.drawTime
            });

            // Send round_start with wordOptions privately to the drawer
            drawerSocket.emit("round_start", {
                drawerId: drawer.playerId,
                wordOptions: room.wordOptions.map(w => w.word),
                drawTime: room.settings.drawTime
            });
        } else {
            // Fallback broadcast if drawer socket is not found
            io.to(room.roomId).emit("round_start", {
                drawerId: drawer.playerId,
                drawTime: room.settings.drawTime
            });
        }

        // Set a 15-second timeout for the drawer to choose a word
        if (selectionTimeouts.has(room.roomId)) {
            clearTimeout(selectionTimeouts.get(room.roomId));
        }

        const selectionTimeout = setTimeout(() => {
            console.log(`Word selection timeout in Room ${room.roomId}. Selecting default word.`);
            // If they didn't choose, select the first option automatically
            if (room.wordOptions.length > 0) {
                const defaultWord = room.wordOptions[0].word;
                autoSelectWord(room, io, defaultWord);
            }
        }, 15000);

        selectionTimeouts.set(room.roomId, selectionTimeout);
    } catch (error) {
        console.error("Start Word Selection Error:", error);
    }
}

/**
 * Helper to select a word automatically when selection timeout occurs
 */
function autoSelectWord(room, io, word) {
    try {
        // Clear timeout
        if (selectionTimeouts.has(room.roomId)) {
            clearTimeout(selectionTimeouts.get(room.roomId));
            selectionTimeouts.delete(room.roomId);
        }

        room.chooseWord(word);
        setupTimerCallbacks(room, io);

        io.to(room.roomId).emit("word_chosen", {
            drawerId: room.currentDrawer?.playerId,
            category: room.currentWord?.category,
            length: room.currentWord?.word.length,
            room: room.toJSON()
        });

        // Broadcast to drawer the chosen word explicitly
        const drawerSocket = io.sockets.sockets.get(room.currentDrawer?.socketId);
        if (drawerSocket) {
            drawerSocket.emit("chosen_word_reveal", { word });
        }
    } catch (error) {
        console.error("Auto Select Word Error:", error);
    }
}

/**
 * Configure the Room timer callbacks for drawing tick and round completion
 */
export function setupTimerCallbacks(room, io) {
    room.timer.onTick = (timeLeft) => {
        io.to(room.roomId).emit("timer_tick", { timeLeft });

        // Update hints
        const oldHint = room.currentHint;
        room.updateRound(); // Checks hint progress

        if (room.currentHint !== oldHint) {
            io.to(room.roomId).emit("hint_update", {
                hint: room.currentHint,
                category: room.currentWord?.category
            });
        }
    };

    room.timer.onComplete = () => {
        handleRoundEnd(room, io, "Time ran out!");
    };
}

/**
 * Ends the round, discloses scores, and queues transition to next round or game over.
 */
export function handleRoundEnd(room, io, reason = "") {
    try {
        // Clear any active selection timeout just in case
        if (selectionTimeouts.has(room.roomId)) {
            clearTimeout(selectionTimeouts.get(room.roomId));
            selectionTimeouts.delete(room.roomId);
        }

        // Stop the timer
        room.timer.stop();
        
        const correctWord = room.currentWord?.word || "";
        room.endRound(); // updates leaderboard and room state to ROUND_END

        // Calculate next drawer preview
        const players = room.getPlayers();
        let nextDrawerId = null;
        if (players.length > 0) {
            const nextIndex = (room.drawerIndex + 1) % players.length;
            nextDrawerId = players[nextIndex]?.playerId;
        }

        io.to(room.roomId).emit("round_end", {
            word: correctWord,
            scores: room.getPlayers().map(p => p.toJSON()),
            nextDrawer: nextDrawerId,
            reason: reason,
            room: room.toJSON()
        });

        console.log(`Round ended in Room ${room.roomId}. Word was: ${correctWord}`);

        // Wait 8 seconds for players to review scores, then start next round
        setTimeout(() => {
            const activeRoom = gameManager.getRoom(room.roomId);
            if (!activeRoom) return; // Room was deleted in the meantime

            activeRoom.prepareNextRound();

            if (activeRoom.state === GAME_STATES.GAME_OVER) {
                // Game Finished!
                io.to(activeRoom.roomId).emit("game_over", {
                    winner: activeRoom.winner ? activeRoom.winner.toJSON() : null,
                    leaderboard: activeRoom.leaderboard.map(p => p.toJSON()),
                    room: activeRoom.toJSON()
                });
                console.log(`Game over in Room ${activeRoom.roomId}`);
            } else {
                // Next Round word selection
                startWordSelection(activeRoom, io);
            }
        }, 8000);
    } catch (error) {
        console.error("Handle Round End Error:", error);
    }
}

export default function gameHandler(io, socket) {
    // 1. Drawer chooses a word
    socket.on("choose_word", (data) => {
        try {
            const word = data?.word;
            const roomId = data?.roomId || socket.roomId;
            const playerId = data?.playerId || socket.playerId;

            console.log(`[choose_word] socket.id=${socket.id}, word=${word}, roomId=${roomId}, playerId=${playerId}`);

            if (!roomId || !playerId) {
                console.log(`[choose_word] Missing roomId (${roomId}) or playerId (${playerId})`);
                return;
            }

            const room = gameManager.getRoom(roomId);
            if (!room) {
                console.log(`[choose_word] Room not found: ${roomId}`);
                return;
            }
            
            if (room.state !== GAME_STATES.WORD_SELECTION) {
                console.log(`[choose_word] Room ${roomId} not in WORD_SELECTION. State: ${room.state}`);
                return socket.emit("error", { message: "Not in word selection phase." });
            }

            if (room.currentDrawer?.playerId !== playerId) {
                console.log(`[choose_word] Sender is not the drawer. Drawer: ${room.currentDrawer?.playerId}, Sender: ${playerId}`);
                return socket.emit("error", { message: "Only the drawer can choose the word." });
            }

            // Clear selection timeout
            if (selectionTimeouts.has(room.roomId)) {
                clearTimeout(selectionTimeouts.get(room.roomId));
                selectionTimeouts.delete(room.roomId);
            }

            room.chooseWord(word); // Puts room state to DRAWING and starts timer
            setupTimerCallbacks(room, io);

            // Broadcast chosen word metadata to players
            io.to(room.roomId).emit("word_chosen", {
                drawerId: room.currentDrawer.playerId,
                category: room.currentWord.category,
                length: room.currentWord.word.length,
                room: room.toJSON()
            });

            // Reveal chosen word specifically to the drawer
            socket.emit("chosen_word_reveal", { word });

            console.log(`Word chosen in Room ${roomId}: ${word}`);
        } catch (error) {
            console.error("Choose Word Event Error:", error);
            socket.emit("error", { message: error.message || "Failed to choose word." });
        }
    });

    // 2. Play again (Reset game to Lobby)
    socket.on("play_again", (data) => {
        try {
            const roomId = data?.roomId || socket.roomId;
            const playerId = data?.playerId || socket.playerId;

            console.log(`[play_again] socket.id=${socket.id}, roomId=${roomId}, playerId=${playerId}`);

            if (!roomId || !playerId) {
                console.log(`[play_again] Missing roomId (${roomId}) or playerId (${playerId})`);
                return;
            }

            const room = gameManager.getRoom(roomId);
            if (!room) {
                console.log(`[play_again] Room not found: ${roomId}`);
                return;
            }

            console.log(`[play_again] Room host is: ${room.host?.playerId}`);

            // Only host can reset
            if (room.host?.playerId !== playerId) {
                console.log(`[play_again] Sender is not host. Host: ${room.host?.playerId}, Sender: ${playerId}`);
                return socket.emit("error", { message: "Only the host can reset the game." });
            }

            room.resetGame(); // state set back to LOBBY, reset scores, etc.
            io.to(room.roomId).emit("room_state", { room: room.toJSON() });

            console.log(`Game reset to Lobby in Room ${roomId}`);
        } catch (error) {
            console.error("Play Again Event Error:", error);
        }
    });
}
