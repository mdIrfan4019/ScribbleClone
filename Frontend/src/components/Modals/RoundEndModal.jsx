import { useSocket } from "../../context/SocketContext";

export default function RoundEndModal() {
  const { chosenWordReveal, players } = useSocket();

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="overlay-container">
      <div className="modal-card glass-panel" style={{ maxWidth: "420px" }}>
        <span style={{ fontSize: "40px" }}>💡</span>
        <h2>Round Concluded!</h2>
        <p style={{ color: "var(--text-muted)" }}>The correct answer was:</p>
        <div className="transition-word-reveal">{chosenWordReveal}</div>

        <div style={{ width: "100%", borderTop: "1px solid var(--border-color)", padding: "16px 0 0" }}>
          <h4 style={{ marginBottom: "12px", textTransform: "uppercase", fontSize: "13px", color: "var(--text-muted)" }}>
            Scoreboard Standings
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {sortedPlayers.slice(0, 5).map((p) => (
              <div key={p.playerId} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span>{p.username}</span>
                <span><strong>{p.score} pts</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
