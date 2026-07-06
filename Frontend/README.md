# 💻 Frontend Client Documentation - Doodle & Guess

The frontend for Doodle & Guess is built using **React** (functional components with Hooks), **Vite** (build tool), and the **Socket.IO Client** for real-time synchronization.

---

## 🏗️ Client State & Context Layer

The frontend manages application data globally using React's **Context API** inside [`SocketContext.jsx`](file:///c:/Users/mdirf/OneDrive/Desktop/AssignProject/ScribbleClone/Frontend/src/context/SocketContext.jsx). This decouples real-time socket events from component rendering lifecycles:

* **State Catalog**:
  * `screen`: Router state (`LOBBY_SELECT`, `WAITING_LOBBY`, `GAME_PLAY`).
  * `roomState`: Holds full deserialized Room settings, scores, rounds, and phase markers.
  * `players`: Registry list of active players in the lobby.
  * `chatMessages`: Log of standard conversations and correct guess system notifications.
  * `timeLeft`: Countdowns synced from server clocks.
  * `isDrawer`: Drawer vs Guesser viewport configuration flag.
  * `hints` / `chosenWordReveal`: Masked hints (`_ _ a _ _` or `? ? ? ?`) shown to guessers versus full reveal shown to the drawer.
* **Context Emitters**:
  * `connectAndAction()`: Connects socket and creates/joins private rooms.
  * `joinPublicRoom()`: Matchmaker trigger for quick-play matchmaking.
  * `leaveRoom()`: Exits lobby, resets states, and returns to homepage.
  * `chooseWord()` / `sendGuess()` / `sendMessage()` / `playAgain()`: Emitter triggers.

---

## 🎨 Whiteboard Coordinate Normalization Math

Whiteboards in real-time games face display variations. If players draw on different screen aspect ratios, lines can render offset. We solve this inside the custom hook [`useCanvas.js`](file:///c:/Users/mdirf/OneDrive/Desktop/AssignProject/ScribbleClone/Frontend/src/hooks/useCanvas.js):

### 1. Drawing Coordinate Normalization
When a drawer draws a stroke, client coordinates are mapped using the bounding rect offset ratio before sending them to the socket server:
$$\text{Normalized } X = \frac{\text{client } X - \text{rect.left}}{\text{rect.width}} \times 800$$
$$\text{Normalized } Y = \frac{\text{client } Y - \text{rect.top}}{\text{rect.height}} \times 500$$

### 2. Whiteboard Rendering Scale
When guessers receive drawing coordinates, they scale the line back to match their local screen aspect ratio:
$$\text{Render } X = \frac{\text{Normalized } X}{800} \times \text{local canvas width}$$
$$\text{Render } Y = \frac{\text{Normalized } Y}{500} \times \text{local canvas height}$$

This resolution-independent scale guarantees that whiteboard drawings are rendered identically on all monitor sizes.

---

## 📂 Component Hierarchy Tree

```
<App>
 ├── <SocketProvider>
 │    ├── <div.bg-orb> (Drifting background blobs)
 │    └── <AppContent> (Screen Router)
 │         ├── Screen: LOBBY_SELECT  ➡️  <LobbySelect> (Form + Rules)
 │         ├── Screen: WAITING_LOBBY ➡️  <WaitingLobby> (Lobby ready-up actions)
 │         └── Screen: GAME_PLAY     ➡️  <GameRoom> (Active Match)
 │              ├── Modals:
 │              │    ├── roomState.state === GAME_OVER        ➡️ <GameOverModal>
 │              │    ├── roomState.state === WORD_SELECTION   ➡️ <WordSelectionModal>
 │              │    └── roomState.state === ROUND_END        ➡️ <RoundEndModal>
 │              ├── Columns Layout:
 │              │    ├── Left:   <LeaderboardSidebar> (Live player ranks)
 │              │    └── Center: <main.game-play-area>
 │              │         ├── HUD:     <div.game-hud> (Time, Word mask, rounds)
 │              │         ├── Whiteboard: <CanvasBoard> (Canvas + toolbar)
 │              │         └── Chat:    <ChatPanel> (Log stream + guess input)
```

---

## 💫 Premium Styles & Keyframe Animations

The application uses custom **dark glassmorphism** defined in [`index.css`](file:///c:/Users/mdirf/OneDrive/Desktop/AssignProject/ScribbleClone/Frontend/src/index.css):

### 1. Ambient Background Blobs
Two blurred, slowly drifting background orbs create depth behind panels:
```css
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(140px);
  z-index: -1;
  opacity: 0.15;
  pointer-events: none;
}
.orb-1 { background: var(--color-primary); top: -10%; left: 15%; animation: drift-slow 25s infinite alternate ease-in-out; }
.orb-2 { background: var(--color-secondary); bottom: 10%; right: 15%; animation: drift-slow-reverse 20s infinite alternate ease-in-out; }
```

### 2. Pulsing Word Highlights
Applies a pulsing outline to chosen drawer words before room countdown:
```css
.word-option-btn.highlight-pulse {
  background: linear-gradient(135deg, var(--color-secondary) 0%, #be185d 100%) !important;
  border-color: var(--color-secondary-light) !important;
  box-shadow: var(--shadow-glow-pink) !important;
  animation: pulse-glow 0.8s infinite alternate !important;
  transform: scale(1.03);
}
```

---

## ⚡ Build & Verification
Compile production builds using:
```bash
npm run build
```
Vite resolves compilation, compiles asset assets (HTML, CSS keyframe sheets, and minified Javascript chunks), and writes static production files into the `/dist` directory in under **230ms**.
