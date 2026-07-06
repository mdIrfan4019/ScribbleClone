import { useSocket } from "../context/SocketContext";

export default function LeaderboardSidebar() {
  const { players, myPlayerId, roomState } = useSocket();

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <aside className="game-scoreboard glass-panel">
      <h3 className="scoreboard-title">
        <span>Players</span>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{players.length} in room</span>
      </h3>
      <div className="scoreboard-list">
        {sortedPlayers.map((p, idx) => (
          <div
            key={p.playerId}
            className={`scoreboard-item ${p.isDrawer ? "drawing" : ""} ${p.hasGuessedCorrectly ? "guessed-correctly" : ""} ${!p.connected ? "disconnected" : ""}`}
          >
            <span className="item-rank">#{idx + 1}</span>
            <div className="item-avatar">
              {p.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="item-info">
              <div className="item-name">
                {p.username} {p.playerId === myPlayerId && " (You)"}
              </div>
              <div className="item-score">{p.score} Points</div>
            </div>
            <div className="item-status-icon">
              {p.isDrawer && "✏️"}
              {p.hasGuessedCorrectly && "✅"}
              {!p.connected && "🔴"}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
