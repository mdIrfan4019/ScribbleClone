# ScribbleClone - Multiplayer skribbl.io Clone (MERN Stack Assignment)

ScribbleClone is a real-time multiplayer drawing and guessing game built with React, Node.js (Express), and Socket.IO.

---

## 🚀 Quick Start (Local Setup)

### 1. Start the Backend Server
```bash
cd Backend
npm install
npm start
```
*The server will run on `http://localhost:5000`.*

### 2. Start the Frontend Client
```bash
cd Frontend
npm install
npm run dev
```
*The client will run on `http://localhost:5173` (or similar Vite port).*

---

## 🛠️ Architecture Overview

The system is split into two layers communicating via real-time WebSocket events:

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│        React Frontend           │                 │         Express Backend         │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ • HTML5 Canvas (Coord Mapping)  │ ◄─── WebSockets ──► • GameManager / Room OOP      │
│ • State-based Screen Router     │     (Socket.IO) │ • Turn & Countdown Timer        │
│ • Chat & Guessing feeds         │                 │ • Word choice selection logic   │
└─────────────────────────────────┘                 └─────────────────────────────────┘
```

### Canvas Scaling & Mapped Coordinates (Gold Standard)
To ensure drawings look identical across screens of different sizes (phones, laptops, monitors), we use a **resolution mapping system**:
1. The canvas always renders internally at a fixed resolution of **800x500 pixels**.
2. When a player draws, we calculate the coordinate percentage relative to their bounding client box width and height.
3. We scale that percentage to the `800x500` space before emitting `draw_start` and `draw_move`.
4. Other players receive the `800x500` coordinate and draw it on their canvases. The browser scales the visual canvas responsively via CSS rules.

---

## 🎓 Code Understanding (Interview Walkthrough Guide)

Here are the key technical answers to prepare you for the recruiter's code walkthrough:

### 1. How drawing strokes are captured, sent, and rendered across clients
- **Capture**: The drawer's mouse/touch events triggers `onMouseDown`/`onTouchStart` on the `<canvas>` element. We calculate relative coordinates mapping to `800x500` coordinate space.
- **Transmission**: The drawer emits `draw_start`, `draw_move`, and `draw_end` socket events containing the coordinate, color, tool (`brush`/`eraser`), and brush size.
- **Rendering**: The socket server receives drawing events and broadcasts them to everyone in the room. Guessing clients listen for these events, push the points to a local `strokesHistory` array, and render the segment directly to their 2D canvas context.
- **Undo / Clear**: When the drawer performs an undo or clears, the backend canvas updates and broadcasts `draw_undo` or `canvas_clear`. Guessing clients pop the last stroke from their local `strokesHistory` array and redraw all remaining strokes to ensure perfect synchronization.

### 2. How game state (rounds, turn order, scoring) is managed
- **State Machine**: The game progresses through states defined in `gameStates.js`: `LOBBY` ➔ `WORD_SELECTION` ➔ `DRAWING` ➔ `ROUND_END` ➔ `GAME_OVER`.
- **OOP Encapsulation**: 
  - `Room` class maintains state configurations, player mappings, and references to `Canvas` and `Timer`.
  - `GameManager` aggregates active rooms in memory.
  - `Timer` controls countdown ticks and executes custom callbacks (`onTick`, `onComplete`).
- **Turn Order**: Rotates drawing players using an internal `drawerIndex` in the Room player list.
- **Scoring**: Points are distributed on correct guesses inside `chatHandler.js` using tier constants:
  - 1st correct guesser: 100 points
  - 2nd: 80 points
  - 3rd: 60 points
  - Others: 50 points
  - Drawer gets a 50-point bonus on the first correct guess.

### 3. How WebSockets are used for real-time sync
- WebSockets maintain an active, full-duplex TCP socket between the client and server.
- The backend initializes `Socket.IO` on top of the HTTP server. It listens for actions (`create_room`, `join_room`, `choose_word`, `guess`, `chat_message`, `draw_start`, etc.).
- When state transitions occur (e.g., word choice made, timer ticks, correct guess received), the server pushes the state downward to all players via `.to(roomId).emit(...)`.

### 4. Word-matching logic
- **Clean Comparison**: We strip whitespace and ignore casing when comparing guesses inside `chatHandler.js`:
  ```javascript
  guessText = text.trim().toLowerCase();
  correctWord = room.currentWord.word.trim().toLowerCase();
  ```
- **Levenshtein Check (Amber Warning)**: If the guess does not match, we run a Levenshtein distance check. If the edit distance is exactly `1` (one letter missing, inserted, or swapped), the server sends a private warning: *"'YourGuess' is very close!"*, encouraging them without spoiling the word for others.
- **Spoiler Protection**: If a player guesses correctly, their chat box is locked out from other guessers. Their future chat messages are green and routed exclusively to the drawer and other correct guessers.

### 5. Deployment Setup & Constraints
- **Platform**: Recommended setup is **Render** or **Railway**.
- **Constraint (Websocket Support)**: Platforms like Vercel and Netlify use Serverless/Edge functions which terminate connection quickly and do not support persistent WebSockets/Socket.IO connections. 
- **Solution**: The frontend can be hosted statically on Vercel/Netlify, but the backend Node/Socket server must be hosted on an application platform (like Render or Railway) that supports long-running stateful servers.
