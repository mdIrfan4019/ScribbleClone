import { randomUUID } from "crypto";

class Player {
    constructor(socketId, username) {

        this.playerId = randomUUID();

        this.socketId = socketId;

        this.username = username.trim();

        this.score = 0;

        this.isHost = false;

        this.isDrawer = false;

        this.isReady = false;

        this.hasGuessedCorrectly = false;

        this.connected = true;

        this.joinedAt = Date.now();
    }

    addScore(points) {
        this.score += points;
    }

    setHost() {
        this.isHost = true;
    }

    removeHost() {
        this.isHost = false;
    }

    setDrawer() {
        this.isDrawer = true;
    }

    removeDrawer() {
        this.isDrawer = false;
    }

    setReady() {
        this.isReady = true;
    }

    setNotReady() {
        this.isReady = false;
    }

    markCorrectGuess() {
        this.hasGuessedCorrectly = true;
    }

    resetRound() {
        this.isDrawer = false;
        this.hasGuessedCorrectly = false;
    }

    resetGame() {
        this.score = 0;
        this.isDrawer = false;
        this.isReady = false;
        this.hasGuessedCorrectly = false;
    }

    disconnect() {
        this.connected = false;
    }

    reconnect(socketId) {
        this.socketId = socketId;
        this.connected = true;
    }

    toJSON() {
        return {
            playerId: this.playerId,
            username: this.username,
            score: this.score,
            isHost: this.isHost,
            isDrawer: this.isDrawer,
            isReady: this.isReady,
            hasGuessedCorrectly: this.hasGuessedCorrectly,
            connected: this.connected,
        };
    }
}

export default Player;