import { useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function LobbySelect() {
  const {
    tab,
    setTab,
    roomId,
    setRoomId,
    connectAndAction,
    joinPublicRoom,
    errorMsg,
    setErrorMsg
  } = useSocket();

  const [localUsername, setLocalUsername] = useState("");
  
  // Room Configuration states
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(60);
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [wordMode, setWordMode] = useState("NORMAL");
  const [lobbyType, setLobbyType] = useState("PRIVATE");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localUsername || localUsername.trim() === "") {
      setErrorMsg("Please enter a username.");
      return;
    }
    setErrorMsg("");
    
    // Calls context function which handles connecting and emitting create/join events
    connectAndAction(
      localUsername.trim(),
      tab,
      maxPlayers,
      rounds,
      drawTime,
      hintsEnabled,
      wordMode,
      lobbyType
    );
  };

  const handleQuickPlay = (e) => {
    e.preventDefault();
    if (!localUsername || localUsername.trim() === "") {
      setErrorMsg("Please enter a username for Quick Play.");
      return;
    }
    setErrorMsg("");
    joinPublicRoom(localUsername.trim());
  };

  return (
    <div className="lobby-container-vertical">
      {/* Top Center Banner */}
      <div className="lobby-banner">
        <span className="hero-logo">✍️</span>
        <h1 className="hero-title">Doodle & Guess!</h1>
        <p className="hero-subtitle">
          The ultimate real-time multiplayer pictionary challenge.
        </p>
      </div>

      {/* Side-by-Side Content Grid */}
      <div className="lobby-grid">
        {/* Left Column: Join/Create Form panel */}
        <div className="lobby-form-panel glass-panel">
          <div className="lobby-tab-container">
            <button
              type="button"
              className={`lobby-tab ${tab === "join" ? "active" : ""}`}
              onClick={() => { setTab("join"); setErrorMsg(""); }}
            >
              Join Room
            </button>
            <button
              type="button"
              className={`lobby-tab ${tab === "create" ? "active" : ""}`}
              onClick={() => { setTab("create"); setErrorMsg(""); }}
            >
              Create Room
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Choose Avatar Name</label>
              <input
                type="text"
                maxLength={12}
                className="glow-input"
                placeholder="e.g. Picasso"
                value={localUsername}
                onChange={(e) => setLocalUsername(e.target.value)}
                required
              />
            </div>

            {tab === "join" ? (
              <div className="form-group">
                <label className="form-label">Enter Room Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="glow-input"
                  style={{ textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "2px" }}
                  placeholder="e.g. AX7Y9P"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Room Configuration</label>
                <div className="settings-grid">
                  <div className="form-group">
                    <span className="form-label" style={{ fontSize: "11px" }}>Rounds</span>
                    <select
                      className="settings-select"
                      value={rounds}
                      onChange={(e) => setRounds(parseInt(e.target.value))}
                    >
                      <option value={2}>2 Rounds</option>
                      <option value={3}>3 Rounds</option>
                      <option value={5}>5 Rounds</option>
                      <option value={10}>10 Rounds</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label" style={{ fontSize: "11px" }}>Draw Time</span>
                    <select
                      className="settings-select"
                      value={drawTime}
                      onChange={(e) => setDrawTime(parseInt(e.target.value))}
                    >
                      <option value={30}>30 Secs</option>
                      <option value={45}>45 Secs</option>
                      <option value={60}>60 Secs</option>
                      <option value={90}>90 Secs</option>
                      <option value={120}>120 Secs</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label" style={{ fontSize: "11px" }}>Max Players</span>
                    <select
                      className="settings-select"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  >
                      <option value={2}>2 Players</option>
                      <option value={5}>5 Players</option>
                      <option value={8}>8 Players</option>
                      <option value={12}>12 Players</option>
                      <option value={20}>20 Players</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label" style={{ fontSize: "11px" }}>Hints</span>
                    <select
                      className="settings-select"
                      value={hintsEnabled ? "yes" : "no"}
                      onChange={(e) => setHintsEnabled(e.target.value === "yes")}
                    >
                      <option value="yes">Enabled</option>
                      <option value="no">Disabled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label" style={{ fontSize: "11px" }}>Word Mode</span>
                    <select
                      className="settings-select"
                      value={wordMode}
                      onChange={(e) => setWordMode(e.target.value)}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIDDEN">Hidden</option>
                      <option value="COMBINATION">Combination</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label" style={{ fontSize: "11px" }}>Lobby Type</span>
                    <select
                      className="settings-select"
                      value={lobbyType}
                      onChange={(e) => setLobbyType(e.target.value)}
                    >
                      <option value="PRIVATE">Private (Invite)</option>
                      <option value="PUBLIC">Public (Matchmaking)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {tab === "join" ? (
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="submit" className="glow-btn" style={{ flex: 1 }}>
                  Enter Arena 🚀
                </button>
                <button type="button" className="glow-btn glow-btn-secondary" style={{ flex: 1 }} onClick={handleQuickPlay}>
                  Quick Play 🎮
                </button>
              </div>
            ) : (
              <button type="submit" className="glow-btn" style={{ marginTop: "8px", width: "100%" }}>
                Spawn Room ⚡
              </button>
            )}
          </form>
        </div>

        {/* Right Column: How to Play & Rules Guidelines panel */}
        <div className="lobby-rules-panel glass-panel">
          <h3 className="guide-header">🎮 How to Play</h3>
          <div className="guide-steps">
            <div className="guide-step">
              <div className="step-num">1</div>
              <div>
                <strong>Pick & Draw:</strong> Choose your secret word and sketch it on the canvas.
              </div>
            </div>
            <div className="guide-step">
              <div className="step-num">2</div>
              <div>
                <strong>Guess:</strong> Submit your guesses in chat to accumulate speed scores.
              </div>
            </div>
            <div className="guide-step">
              <div className="step-num">3</div>
              <div>
                <strong>Win:</strong> Outscore your opponents to claim the podium crown!
              </div>
            </div>
          </div>

          <h3 className="guide-header" style={{ marginTop: "8px" }}>📜 Game Rules</h3>
          <ul className="guide-rules-list">
            <li>Do not write letters or numbers on the canvas drawing board.</li>
            <li>Ensure chat remains polite, constructive, and clean.</li>
            <li>Try Hidden and Combination settings for a tougher match.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
