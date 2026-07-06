import { useState } from "react";
import { useSocket } from "../../context/SocketContext";

export default function WordSelectionModal() {
  const { isDrawer, wordOptions, chooseWord, roomState } = useSocket();
  const [clickedWord, setClickedWord] = useState(null);

  const handlePick = (word) => {
    if (clickedWord) return; // prevent duplicate clicks
    setClickedWord(word);
    
    // Highlight and wait 3 seconds before emitting socket word selection
    setTimeout(() => {
      chooseWord(word);
    }, 3000);
  };

  return (
    <div className="overlay-container">
      <div className="modal-card glass-panel" style={{ maxWidth: "420px" }}>
        {isDrawer ? (
          <>
            <h2>Select a Word to Draw</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Choose from the choices below to start drawing.
            </p>
            <div className="word-options-list">
              {wordOptions.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  className={`word-option-btn ${clickedWord === opt ? "highlight-pulse" : ""}`}
                  style={clickedWord && clickedWord !== opt ? { opacity: 0.5, transform: "none", pointerEvents: "none" } : {}}
                  disabled={clickedWord !== null}
                  onClick={() => handlePick(opt)}
                >
                  {opt} {clickedWord === opt ? " ⏱️ Starting..." : ""}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="hero-logo" style={{ fontSize: "50px" }}>✏️</div>
            <h2>Selecting Word...</h2>
            <p style={{ color: "var(--text-muted)" }}>
              <strong>
                {roomState?.players?.find(p => p.playerId === roomState?.currentDrawer)?.username || "The drawer"}
              </strong> is choosing a word.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
