import { io } from "socket.io-client";

// Retrieve backend socket URL from Vite environment variables, or fall back to localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

console.log(`Connecting socket to: ${SOCKET_URL}`);

// Initialize the socket client with autoConnect disabled
// We will manually trigger connect() once the user sets their username and creates/joins a room.
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    withCredentials: true
});
