# ⚙️ Backend Server Documentation - Doodle & Guess

This directory houses the WebSocket game server logic for Doodle & Guess. It is built using **Node.js**, **Express**, and **Socket.IO** using modern ES Modules.

---

## 🛠️ Object-Oriented State Architecture

The backend manages game rooms in-memory using strict Object-Oriented Programming (OOP) paradigms. This ensures high-performance state lookups and prevents namespace pollution.

### Core Class Catalog

#### 1. `Player` (encapsulating connected users)
* **Properties**:
  * `playerId`: String (Unique UUID)
  * `socketId`: String (Socket connection identifier)
  * `username`: String
  * `score`: Number (Player accumulative match points)
  * `isReady`: Boolean (Lobby ready-up state)
  * `isHost`: Boolean (Admin authority flag)
  * `isDrawer`: Boolean (Active round drawing flag)
  * `hasGuessedCorrectly`: Boolean (Mutes chat and scores point multipliers)
* **Key Methods**:
  * `addScore(points)`: Appends round speed points
  * `resetRoundState()`: Wipes guess and drawing flags for next turn
  * `toJSON()`: Serializes class state for WebSocket broadasts

#### 2. `Room` (orchestrating game loops)
* **Properties**:
  * `roomId`: String (6-character invite code)
  * `type`: String (`PUBLIC` or `PRIVATE`)
  * `state`: String (`LOBBY`, `WORD_SELECTION`, `DRAWING`, `ROUND_END`, `GAME_OVER`)
  * `players`: Map (Registry mapping `playerId` ➡️ `Player`)
  * `settings`: Object (`maxPlayers`, `rounds`, `drawTime`, `wordChoices`, `hints`, `wordMode`)
  * `currentRound`: Number
  * `wordOptions`: Array (3 secret drawing word options)
  * `currentWord`: Object (Secret word, categories, length)
  * `currentHint`: String (Masked version of the secret word)
  * `timer`: Timer instance
  * `canvas`: Canvas instance
  * `wordManager`: WordManager instance
* **Key Methods**:
  * `addPlayer(player)`: Registers player to socket room map
  * `removePlayer(playerId)`: Cleans up player and reassigns host if needed
  * `startGame()`: Shifts room to `WORD_SELECTION` state and rotates turns
  * `chooseWord(word)`: Sets drawing word and triggers drawing clock
  * `handleCorrectGuess(playerId)`: Calculates decay scores and check game end triggers
  * `toJSON()`: Sanitizes circular references and formats output for client routing

#### 3. `Timer` (tick callbacks loop wrapper)
* **Properties**:
  * `timeLeft`: Number
  * `callback`: Function (Fires every tick)
  * `onComplete`: Function (Fires when timer hits 0)
* **Key Methods**:
  * `start()`: Initializes interval loops
  * `stop()`: Halts timers safely

#### 4. `WordManager` (fetcher & category indexer)
* **Properties**:
  * `usedWords`: Set (Logs drawn words in a match to prevent repeats)
* **Key Methods**:
  * `getWordOptions(count)`: Returns `N` random unique categorized words
  * `setCurrentWord(word)` / `checkGuess(text)`: Validation checks

---

## ⚡ Socket Event API Handlers

Socket connections are divided into single-purpose modular handlers registered inside `/src/socket/handlers/`:

### 1. `roomHandler.js` (Lobby operations)
* **`create_room`**: Instantiates a new `Room` (Public or Private) with configurable host settings.
* **`join_room`**: Places a player into a private room. Rejects connection if room is full or name is taken.
* **`join_public_room`**: **Matchmaker engine** that searches for open public rooms. Spawns one automatically if none are available. Auto-starts game once 2 players enter.
* **`toggle_ready`**: Modifies ready flags and updates the lobby scoreboard.
* **`leave_room`** / **`disconnect`**: Cleans up registry links and updates remaining players.

### 2. `gameHandler.js` (Game loop orchestration)
* **`start_game`**: Shifts room state to `WORD_SELECTION`.
* **`choose_word`**: Drawer picks a word from the choice list, triggering the round drawing phase.
* **`guess`**: Validates a guesser's chat text. If correct, awards points and triggers success notifications.
* **`chat`**: Transmits general messages. Mutes players who have already guessed correctly.
* **`play_again`**: Resets round counters and points arrays for the host to restart.

### 3. `drawHandler.js` (Whiteboard sync)
* **`draw_start`** / **`draw_move`** / **`draw_end`**: Broadcasts scaled coordinates to all guessers.
* **`canvas_clear`**: Wipes coordinates cache.
* **`draw_undo`**: Pops the last drawing path.

---

## 🛡️ Exception Guard & Process Logging
To prevent runtime crashes, [`server.js`](file:///c:/Users/mdirf/OneDrive/Desktop/AssignProject/ScribbleClone/Backend/src/server.js) utilizes process-level error event triggers:
* **`uncaughtException`**: Prevents node thread failures from shutting down active server rooms.
* **`unhandledRejection`**: Intercepts failed async Promises (like database operations or lost network handshakes), logging errors without dropping the backend process.
