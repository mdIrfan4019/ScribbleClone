import { useSocket } from "../../context/SocketContext";

export default function GameOverModal() {
  const { players, isHost, playAgain, leaveRoom } = useSocket();

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="overlay-container">
      <div className="modal-card glass-panel">
        <span className="crown-icon">👑</span>
        <h2>Champion Board</h2>
        
        {sortedPlayers.length > 0 && (
          <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-warning)" }}>
            🏆 {sortedPlayers[0].username} Wins!
          </p>
        )}

        <div className="podium-container">
          {/* 2nd place */}
          {sortedPlayers[1] && (
            <div className="podium-place second">
              <span className="podium-name">{sortedPlayers[1].username}</span>
              <span className="podium-score">{sortedPlayers[1].score} pts</span>
              <div className="podium-bar">2nd</div>
            </div>
          )}
          {/* 1st place */}
          {sortedPlayers[0] && (
            <div className="podium-place first">
              <span className="crown-icon" style={{ fontSize: "18px" }}>👑</span>
              <span className="podium-name">{sortedPlayers[0].username}</span>
              <span className="podium-score">{sortedPlayers[0].score} pts</span>
              <div className="podium-bar">1st</div>
            </div>
          )}
          {/* 3rd place */}
          {sortedPlayers[2] && (
            <div className="podium-place third">
              <span className="podium-name">{sortedPlayers[2].username}</span>
              <span className="podium-score">{sortedPlayers[2].score} pts</span>
              <div className="podium-bar">3rd</div>
            </div>
          )}
        </div>

        <div style={{ width: "100%", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {sortedPlayers.map((p, idx) => (
            <div key={p.playerId} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
              <span>#{idx + 1} {p.username}</span>
              <span>{p.score} pts</span>
            </div>
          ))}
        </div>

        {isHost ? (
          <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
            <button type="button" className="glow-btn" onClick={playAgain} style={{ flex: 1 }}>
              Play Again 🎮
            </button>
            <button type="button" className="glow-btn glow-btn-secondary" onClick={leaveRoom} style={{ flex: 1 }}>
              Leave Arena 🚪
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <button type="button" className="glow-btn glow-btn-secondary" onClick={leaveRoom} style={{ width: "100%" }}>
              Leave Arena 🚪
            </button>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>
              Waiting for host to spawn another round...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
