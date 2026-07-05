import { randomUUID } from "crypto";

class Room {
    constructor(hostPlayer, settings = {}) {
        this.roomId = randomUUID().slice(0, 6).toUpperCase();

        this.type = settings.type || "PRIVATE";

        this.host = hostPlayer;

        this.players = new Map();

        this.players.set(hostPlayer.playerId, hostPlayer);

        hostPlayer.setHost();

        this.settings = {
            maxPlayers: settings.maxPlayers || 8,
            rounds: settings.rounds || 3,
            drawTime: settings.drawTime || 60,
            wordChoices: settings.wordChoices || 3,
            hints: settings.hints ?? true,
        };

        this.state = "LOBBY";
    }

    addPlayer(player) {
        if (this.isFull()) {
            throw new Error("Room is full.");
        }

        this.players.set(player.playerId, player);
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);

        if (!player) return;

        const wasHost = player.isHost;

        this.players.delete(playerId);

        if (wasHost) {
            this.assignNewHost();
        }
    }

    assignNewHost() {
        if (this.players.size === 0) {
            this.host = null;
            return;
        }

        const newHost = [...this.players.values()][0];

        newHost.setHost();

        this.host = newHost;
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    getPlayers() {
        return [...this.players.values()];
    }

    getPlayerCount() {
        return this.players.size;
    }

    isFull() {
        return this.players.size >= this.settings.maxPlayers;
    }

    isEmpty() {
        return this.players.size === 0;
    }

    allPlayersReady() {
        return [...this.players.values()].every(
            (player) => player.isReady
        );
    }

    resetReadyStatus() {
        this.players.forEach((player) => {
            player.setNotReady();
        });
    }

    updateSettings(settings = {}) {
        this.settings = {
            ...this.settings,
            ...settings,
        };
    }

    toJSON() {
        return {
            roomId: this.roomId,

            type: this.type,

            state: this.state,

            host: this.host?.playerId,

            settings: this.settings,

            playerCount: this.players.size,

            players: [...this.players.values()].map((player) =>
                player.toJSON()
            ),
        };
    }
}

export default Room;