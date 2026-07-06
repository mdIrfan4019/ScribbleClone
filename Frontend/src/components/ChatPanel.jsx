import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

export default function ChatPanel() {
  const {
    chatMessages,
    isDrawer,
    hasGuessedCorrectly,
    sendGuess,
    sendMessage,
    roomState
  } = useSocket();

  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatInput || chatInput.trim() === "") return;

    if (roomState?.state === "DRAWING" && !isDrawer && !hasGuessedCorrectly) {
      sendGuess(chatInput.trim());
    } else {
      sendMessage(chatInput.trim());
    }

    setChatInput("");
  };

  return (
    <aside className="game-chat-panel glass-panel">
      <div className="chat-header">Game Messages & Chat</div>
      <div className="chat-messages">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${
              msg.system
                ? msg.guessCorrect
                  ? "correct"
                  : msg.isCloseWarning
                    ? "warning"
                    : "system"
                : msg.specialGroup === "correct"
                  ? "correct"
                  : msg.isDrawer
                    ? "drawer"
                    : "normal"
            }`}
          >
            {msg.system ? (
              <span className="chat-msg-text">💡 {msg.text}</span>
            ) : (
              <>
                <span className="chat-msg-sender">{msg.playerName}:</span>
                <span className="chat-msg-text">
                  {msg.specialGroup === "correct" ? "💬 (Correct Guessers) " : ""}
                  {msg.text}
                </span>
              </>
            )}
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          className="chat-input"
          placeholder={
            isDrawer
              ? "Drawer cannot guess!"
              : hasGuessedCorrectly
                ? "Guessed correctly! Chatting with winners..."
                : "Type your guess here..."
          }
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isDrawer}
          autoComplete="off"
        />
        <button
          type="submit"
          className="glow-btn"
          style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)" }}
          disabled={isDrawer}
        >
          Send
        </button>
      </form>
    </aside>
  );
}
