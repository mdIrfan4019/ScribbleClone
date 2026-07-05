import Room from "./Room.js";
import { ROOM_TYPES } from "../constants/roomTypes.js";
import { GAME_STATES } from "../constants/gameStates.js";

class GameManager {

    constructor() {

        // roomId -> Room
        this.rooms = new Map();

    }

    /*
    ==========================================
            CREATE ROOM
    ==========================================
    */

    createRoom(hostPlayer, settings = {}) {

        const room = new Room(hostPlayer, settings);

        this.rooms.set(room.roomId, room);

        return room;

    }

    /*
    ==========================================
            GET ROOM
    ==========================================
    */

    getRoom(roomId) {

        return this.rooms.get(roomId);

    }

    /*
    ==========================================
            ROOM EXISTS
    ==========================================
    */

    roomExists(roomId) {

        return this.rooms.has(roomId);

    }

    /*
    ==========================================
            DELETE ROOM
    ==========================================
    */

    deleteRoom(roomId) {

        this.rooms.delete(roomId);

    }

    /*
    ==========================================
            JOIN ROOM
    ==========================================
    */

    joinRoom(roomId, player) {

        const room = this.getRoom(roomId);

        if (!room) {

            throw new Error("Room not found.");

        }

        if (room.isFull()) {

            throw new Error("Room is full.");

        }

        room.addPlayer(player);

        return room;

    }

    /*
    ==========================================
            LEAVE ROOM
    ==========================================
    */

    leaveRoom(roomId, playerId) {

        const room = this.getRoom(roomId);

        if (!room) return;

        room.removePlayer(playerId);

        if (room.isEmpty()) {

            this.deleteRoom(roomId);

        }

    }

    /*
    ==========================================
        FIND AVAILABLE PUBLIC ROOM
    ==========================================
    */

    findPublicRoom() {

        for (const room of this.rooms.values()) {

            if (

                room.type === ROOM_TYPES.PUBLIC &&

                !room.isFull() &&

                room.state === GAME_STATES.LOBBY

            ) {

                return room;

            }

        }

        return null;

    }

    /*
    ==========================================
            GET PUBLIC ROOMS
    ==========================================
    */

    getPublicRooms() {

        return [...this.rooms.values()].filter(

            room => room.type === "PUBLIC"

        );

    }

    /*
    ==========================================
            TOTAL ROOMS
    ==========================================
    */

    getRoomCount() {

        return this.rooms.size;

    }

    /*
    ==========================================
            TOTAL PLAYERS
    ==========================================
    */

    getPlayerCount() {

        let total = 0;

        this.rooms.forEach(room => {

            total += room.getPlayerCount();

        });

        return total;

    }

    /*
    ==========================================
            SERVER STATS
    ==========================================
    */

    getStatistics() {

        return {

            totalRooms: this.getRoomCount(),

            totalPlayers: this.getPlayerCount(),

            publicRooms: this.getPublicRooms().length

        };

    }

}

const gameManager = new GameManager();

export default gameManager;