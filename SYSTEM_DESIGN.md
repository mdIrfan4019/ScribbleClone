# 📐 System Design Documentation - Doodle & Guess

This document outlines the high-level architecture, communication protocols, mathematical algorithms, and performance optimization policies implemented in the Doodle & Guess (skribbl.io clone) application.

---

## 1. Architectural Patterns

The system is designed around two core patterns: an **Event-Driven Client-Server model** and a **Server-Authoritative State Engine**.

```
   ┌─────────────────────────────────────────────────────────┐
   │                    Client Viewport                      │
   │   - Lightweight React Renderer                          │
   │   - Local Canvas Scaling Transforms                     │
   │   - Context Socket Emitter triggers                     │
   └───────────────────────────┬─────────────────────────────┘
                               │
                               │  Bidirectional WebSockets
                               │  (TCP Socket.IO Events)
                               │
   ┌───────────────────────────▼─────────────────────────────┐
   │                Authoritative Server                     │
   │   - Single source of room state truth                   │
   │   - Time-decay scoring & validation engines             │
   │   - Turn queue cycling manager                          │
   └─────────────────────────────────────────────────────────┘
```

### Server-Authoritative State Engine
To prevent cheating, duplication, or state desynchronization across game rooms:
* The client makes no assumptions about game rules, timer decrements, points distributions, or active drawing round statuses.
* The backend server holds the **single source of truth**. It maintains rooms, player stats, active drawing categories, word validation checks, and tick intervals.
* Clients only act as thin rendering shells, capturing user inputs (like drawing mouse coordinate movements or text guesses) and sending them as events, then updating their visual panels based on server-broadcasted states.

---

## 2. Real-Time WebSocket Messaging Protocol

For a multiplayer drawing game, response latency is critical. We selected **WebSockets (via Socket.IO)** instead of HTTP Polling or Server-Sent Events (SSE):

* **Bi-directional Communication**: WebSockets allow both clients (e.g. drawer sending coordinates) and the server (e.g. broadcasting coordinates to guessers) to push messages instantly over a single persistent TCP connection.
* **Low Payload Overhead**: Unlike HTTP, which requires sending headers, cookies, and connection metadata with every request, WebSockets transmit messages with minimal frame headers (a few bytes), ensuring low-latency stroke synchronization.
* **Socket.IO Layer**: We utilized Socket.IO to manage connection reconnections, heartbeat checks, automatic transport fallbacks, and logical room segmentations.

---

## 3. Mathematical Models & Algorithms

### A. Points Time-Decay & Speed Bonus Algorithm
To reward both speed and accuracy, guesser scores are calculated using a linear time-decay function. The faster a player guesses the secret word, the more points they earn.

#### 1. Guesser Points Formula:
When player $i$ guesses the correct word at time $t$ (where $t$ is the remaining seconds on the draw clock, and $D$ is the total draw time configured for the room):
$$P_{\text{guesser}} = \text{Base Points} \times \left( \frac{t_{\text{left}}}{D_{\text{total}}} \right)$$
* *Example: With a base of 500 points on a 60-second clock, guessing the word at 45 seconds remaining yields $500 \times (45 / 60) = 375$ points.*
* The first player to guess correctly gets an additional **50-point Speed Bonus**.

#### 2. Drawer Points Formula:
To encourage drawers to sketch clues clearly and help others guess, the drawer receives points proportional to the speed and accuracy of the guessers:
$$P_{\text{drawer}} = \sum_{i=1}^{k} \left( \frac{P_{\text{guesser}_i}}{2 \times k} \right)$$
*Where $k$ is the number of players who guessed correctly.*
* This alignment of incentives rewards drawers for making their drawings clear and recognizable.

---

### B. Canvas Coordinate Scale Normalization Algebra
Drawers and guessers often play on devices with different screen aspect ratios. If raw coordinates are sent, drawings will render offset or cut off on smaller screens.

#### 1. Client Normalization (Drawer side):
When drawing on local canvas dimensions ($W_{\text{local}} \times H_{\text{local}}$), the coordinates are mapped to a fixed logical viewport grid of **$800 \times 500$ logical units**:
$$X_{\text{normal}} = \frac{X_{\text{local}} - \text{offset}_X}{W_{\text{local}}} \times 800$$
$$Y_{\text{normal}} = \frac{Y_{\text{local}} - \text{offset}_Y}{H_{\text{local}}} \times 500$$

#### 2. Client Restructuring (Guesser side):
When the guesser receives $(X_{\text{normal}}, Y_{\text{normal}})$ from the server, they scale it to match their local viewport dimensions ($W_{\text{client}} \times H_{\text{client}}$):
$$X_{\text{render}} = \frac{X_{\text{normal}}}{800} \times W_{\text{client}}$$
$$Y_{\text{render}} = \frac{Y_{\text{normal}}}{500} \times H_{\text{client}}$$

This aspect-ratio-independent transformation guarantees identical coordinate scaling across desktop monitors, tablets, and mobile screens.

---

## 4. Performance & Memory Optimizations

### A. Garbage Collection (Lobby Deletion)
In-memory room maps can cause memory leaks on the server over time if rooms are left open indefinitely.
* **The Policy**: The `GameManager` class tracks player counts in each room. 
* **The Cleanup**: Once a player leaves or disconnects, if a room's player count drops to `0`, the server automatically invokes `deleteRoom(roomId)`, removing all class instances from the registry maps. This ensures the Node process retains a low memory footprint.

### B. Network Traffic Throttling
Drawing generates hundreds of coordinate coordinates per second. Broadcasting every single coordinate as an independent packet can saturate connections and cause network lag.
* **The Optimization**: Client canvas movements are throttled to ensure strokes are batched together and sent in minor tick intervals.
* **Socket Transport Config**: Enforced `transports: ["websocket"]` as the primary transport protocol to bypass the overhead of HTTP Long Polling request loops.
