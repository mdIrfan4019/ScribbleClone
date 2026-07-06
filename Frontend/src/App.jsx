import { SocketProvider, useSocket } from "./context/SocketContext.jsx";
import LobbySelect from "./components/LobbySelect.jsx";
import WaitingLobby from "./components/WaitingLobby.jsx";
import LeaderboardSidebar from "./components/LeaderboardSidebar.jsx";
import CanvasBoard from "./components/CanvasBoard.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import WordSelectionModal from "./components/Modals/WordSelectionModal.jsx";
import RoundEndModal from "./components/Modals/RoundEndModal.jsx";
import GameOverModal from "./components/Modals/GameOverModal.jsx";
import "./App.css";

function GameRoom() {
  const { roomState, isDrawer, chosenWordReveal, hints, category, wordLength, timeLeft, leaveRoom } = useSocket();

  return (
    <div className="game-container">
      {/* Modals & Overlays based on state */}
      {roomState?.state === "GAME_OVER" && <GameOverModal />}
      {roomState?.state === "WORD_SELECTION" && <WordSelectionModal />}
      {roomState?.state === "ROUND_END" && <RoundEndModal />}

      {/* Left Column: Player Scoreboard Sidebar */}
      <LeaderboardSidebar />

      {/* Center Column: Game HUD, Canvas Drawing board, Toolbar */}
      <main className="game-play-area">
        <div className="game-hud glass-panel">
          <div className="hud-info">
            <div className={`hud-timer ${timeLeft <= 10 && roomState?.state === "DRAWING" ? "hurry" : ""}`}>
              {timeLeft}
            </div>
            <div className="hud-word-display">
              <div className="hud-masked-word">
                {isDrawer ? chosenWordReveal : hints}
              </div>
              <div className="hud-word-hint">
                {category && <span>Category: <strong>{category}</strong> | </span>}
                <span>Word Length: <strong>{wordLength} letters</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span className="stat-pill">
              Rounds: {roomState?.currentRound} / {roomState?.settings?.rounds}
            </span>
            <button
              type="button"
              className="glow-btn glow-btn-secondary"
              style={{ padding: "6px 12px", fontSize: "12px", height: "32px", display: "inline-flex", alignItems: "center" }}
              onClick={leaveRoom}
            >
              Leave Room 🚪
            </button>
          </div>
        </div>

        {/* Scaled Canvas Board and drawing tools */}
        <CanvasBoard />
      </main>

      {/* Right Column: Chat logging stream and guess submission forms */}
      <ChatPanel />
    </div>
  );
}

function AppContent() {
  const { screen, errorMsg } = useSocket();

  return (
    <div className="App">
      {errorMsg && (
        <div
          className="glass-panel"
          style={{
            margin: "16px auto",
            maxWidth: "600px",
            padding: "12px",
            borderLeft: "4px solid var(--color-error)",
            background: "rgba(239, 68, 68, 0.1)"
          }}
        >
          <p style={{ color: "var(--color-error)", fontWeight: 600 }}>⚠️ {errorMsg}</p>
        </div>
      )}

      {screen === "LOBBY_SELECT" && <LobbySelect />}
      {screen === "WAITING_LOBBY" && <WaitingLobby />}
      {screen === "GAME_PLAY" && <GameRoom />}
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <AppContent />
    </SocketProvider>
  );
}
