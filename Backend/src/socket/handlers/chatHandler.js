import gameManager from "../../classes/GameManager.js";
import { GAME_STATES } from "../../constants/gameStates.js";
import { SCORE } from "../../constants/scoreConstants.js";
import { handleRoundEnd } from "./gameHandler.js";

export default function chatHandler(io, socket) {
    // 1. Handle normal chat messages (also handles post-guess communication)
    socket.on("chat_message", ({ text }) => {
        try {
            const { roomId, playerId } = socket;
            if (!roomId || !playerId || !text || text.trim() === "") return;

            const room = gameManager.getRoom(roomId);
            if (!room) return;

            const player = room.getPlayer(playerId);
            if (!player) return;

            const messagePayload = {
                playerId: player.playerId,
                playerName: player.username,
                text: text.trim(),
                isCorrectUser: player.hasGuessedCorrectly,
                isDrawer: player.isDrawer
            };

            // Spoiler Protection:
            // If the player has already guessed correctly, their chat is only visible
            // to other players who guessed correctly and the drawer.
            if (player.hasGuessedCorrectly && room.state === GAME_STATES.DRAWING) {
                room.getPlayers().forEach(p => {
                    if (p.hasGuessedCorrectly || p.isDrawer) {
                        io.to(p.socketId).emit("chat_message", {
                            ...messagePayload,
                            specialGroup: "correct" // visual distinction on frontend
                        });
                    }
                });
            } else {
                // Otherwise, normal message visible to everyone
                io.to(room.roomId).emit("chat_message", messagePayload);
            }
        } catch (error) {
            console.error("Chat Message Error:", error);
        }
    });

    // 2. Handle guess submissions
    socket.on("guess", ({ text }) => {
        try {
            const { roomId, playerId } = socket;
            if (!roomId || !playerId || !text || text.trim() === "") return;

            const room = gameManager.getRoom(roomId);
            if (!room) return;

            const player = room.getPlayer(playerId);
            if (!player) return;

            // Drawer cannot guess
            if (player.isDrawer) {
                return socket.emit("error", { message: "The drawer cannot make guesses." });
            }

            // Game must be in DRAWING phase
            if (room.state !== GAME_STATES.DRAWING) {
                return socket.emit("error", { message: "Guesses are only allowed during the drawing phase." });
            }

            // Already guessed correctly
            if (player.hasGuessedCorrectly) {
                return socket.emit("error", { message: "You have already guessed the word." });
            }

            const guessText = text.trim().toLowerCase();
            const correctWord = room.currentWord?.word?.trim()?.toLowerCase();

            if (guessText === correctWord) {
                // Correct guess!
                player.markCorrectGuess();

                // Calculate point tier
                // Number of players who had already guessed correctly in this round (including this player)
                const correctGuessers = room.getPlayers().filter(p => p.hasGuessedCorrectly);
                const order = correctGuessers.length;

                let pointsEarned = 50; // default for 4th onwards
                if (order === 1) {
                    pointsEarned = SCORE.FIRST_GUESS;
                } else if (order === 2) {
                    pointsEarned = SCORE.SECOND_GUESS;
                } else if (order === 3) {
                    pointsEarned = SCORE.THIRD_GUESS;
                }

                // Apply points to player
                player.addScore(pointsEarned);

                // Drawer Bonus points:
                // Award the drawer SCORE.DRAWER_BONUS (50 points) on the first correct guess
                const drawer = room.getCurrentDrawer();
                if (order === 1 && drawer) {
                    drawer.addScore(SCORE.DRAWER_BONUS);
                }

                // Send private success socket notification
                socket.emit("guess_result", {
                    correct: true,
                    points: pointsEarned,
                    word: room.currentWord?.word
                });

                // Broadcast system guess message (so other players don't see the literal word)
                io.to(room.roomId).emit("chat_message", {
                    system: true,
                    guessCorrect: true,
                    text: `${player.username} guessed the word!`
                });

                // Broadcast updated room scores
                io.to(room.roomId).emit("room_state", { room: room.toJSON() });

                // Check if all guessers have guessed correctly
                // Check if all guessers have guessed correctly (bulletproof check)
                const activeDrawer = room.getCurrentDrawer();
                const guessers = room.getPlayers().filter(p => !activeDrawer || p.playerId !== activeDrawer.playerId);
                const totalGuessersCount = guessers.length;
                const correctGuessersCount = guessers.filter(p => p.hasGuessedCorrectly).length;

                console.log("=== DEBUG GAME LOOP STATE ===");
                console.log("Room ID:", room.roomId);
                console.log("Players:", room.getPlayers().map(p => p.username));
                console.log("Drawer:", activeDrawer?.username);
                console.log("totalGuessersCount:", totalGuessersCount);
                console.log("correctGuessersCount:", correctGuessersCount);
                console.log("=============================");

                if (correctGuessersCount === totalGuessersCount && totalGuessersCount > 0) {
                    handleRoundEnd(room, io, "Everyone guessed the word!");
                }
            } else {
                // Check Levenshtein distance for close guesses (1 character off)
                const isClose = checkLevenshtein(guessText, correctWord);
                if (isClose) {
                    socket.emit("chat_message", {
                        system: true,
                        isCloseWarning: true,
                        text: `'${text}' is very close!`
                    });
                }

                // Differentiate guess from normal chat: broadcast guess to other guessers
                // In Pictionary, incorrect guesses are shown in general chat stream for all to see
                io.to(room.roomId).emit("chat_message", {
                    playerId: player.playerId,
                    playerName: player.username,
                    text: text.trim(),
                    isGuess: true
                });
            }
        } catch (error) {
            console.error("Guess Event Error:", error);
        }
    });
}

/**
 * Basic Levenshtein distance check to identify if a guess is 1 character off.
 */
function checkLevenshtein(str1, str2) {
    if (!str1 || !str2) return false;
    const len1 = str1.length;
    const len2 = str2.length;

    // We only care if length difference is at most 1
    if (Math.abs(len1 - len2) > 1) return false;

    let edits = 0;
    let i = 0;
    let j = 0;

    while (i < len1 && j < len2) {
        if (str1[i] !== str2[j]) {
            edits++;
            if (edits > 1) return false;

            if (len1 > len2) {
                i++;
            } else if (len2 > len1) {
                j++;
            } else {
                i++;
                j++;
            }
        } else {
            i++;
            j++;
        }
    }

    if (i < len1 || j < len2) edits++;
    return edits === 1;
}
