import { useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function WaitingLobby() {
  const {
    roomId,
    players,
    myPlayerId,
    isHost,
    roomState,
    toggleReady,
    startGame,
    leaveRoom
  } = useSocket();

  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setShowCopyTooltip(true);
    setTimeout(() => setShowCopyTooltip(false), 2000);
  };

  const isMeReady = players.find(p => p.playerId === myPlayerId)?.isReady;

  return (
    <div className="waiting-lobby-container glass-panel">
      <div className="waiting-header">
        <div>
          <h2 className="waiting-title">Waiting Lobby</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Waiting for the host to commence the match.
          </p>
        </div>

        <div className="room-invite-pill">
          <span>Code:</span>
          <strong className="invite-code">{roomId}</strong>
          <button
            type="button"
            className="glow-btn glow-btn-outline"
            style={{ padding: "4px 8px", fontSize: "12px" }}
            onClick={copyInviteLink}
          >
            {showCopyTooltip ? "Copied! ✓" : "Copy Invite Link 📋"}
          </button>
        </div>
      </div>

      <div className="waiting-players-grid">
        {players.map((p) => (
          <div key={p.playerId} className={`player-card glass-panel ${p.isReady ? "ready" : ""} ${p.isHost ? "host" : ""}`}>
            <div className="player-avatar">
              {p.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="player-name-lbl">{p.username}</div>
            <div>
              {p.isHost ? (
                <span className="badge badge-host">Host</span>
              ) : p.isReady ? (
                <span className="badge badge-ready">Ready</span>
              ) : (
                <span className="badge badge-waiting">Waiting</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="waiting-actions">
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Settings: {roomState?.settings?.rounds} Rounds | {roomState?.settings?.drawTime}s Draw Time | {roomState?.settings?.maxPlayers} Max Players
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            className="glow-btn glow-btn-outline"
            onClick={leaveRoom}
          >
            Leave Lobby 🚪
          </button>

          {!isHost && (
            <button
              type="button"
              className={`glow-btn ${isMeReady ? "glow-btn-secondary" : ""}`}
              onClick={toggleReady}
            >
              {isMeReady ? "Cancel Ready ✕" : "Ready Up! ✓"}
            </button>
          )}

          {isHost && (
            <button
              type="button"
              className="glow-btn glow-btn-secondary"
              disabled={players.length < 2}
              onClick={startGame}
            >
              Start Match ({players.length}/2+ players) ⚡
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
