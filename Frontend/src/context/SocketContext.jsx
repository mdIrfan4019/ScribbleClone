import { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../socket.js";

const SocketContext = createContext(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

export function SocketProvider({ children }) {
  // Navigation & Screen States
  const [screen, setScreen] = useState("LOBBY_SELECT"); // LOBBY_SELECT, WAITING_LOBBY, GAME_PLAY
  const [tab, setTab] = useState("join"); // join, create
  const [errorMsg, setErrorMsg] = useState("");

  // User States
  const [username, setUsername] = useState("");
  const [myPlayerId, setMyPlayerId] = useState("");

  // Room / Lobby States
  const [roomId, setRoomId] = useState("");
  const [roomState, setRoomState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  // Game states
  const [isDrawer, setIsDrawer] = useState(false);
  const [wordOptions, setWordOptions] = useState([]);
  const [chosenWordReveal, setChosenWordReveal] = useState("");
  const [hints, setHints] = useState("");
  const [category, setCategory] = useState("");
  const [wordLength, setWordLength] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);

  // Initialize socket query param from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room");
    if (code) {
      setRoomId(code.toUpperCase());
      setTab("join");
    }
  }, []);

  // Set up WebSocket Listeners
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Context socket connected");
    });

    socket.on("error", (data) => {
      setErrorMsg(data.message || "An error occurred.");
    });

    socket.on("room_created", ({ roomId, playerId, room }) => {
      setMyPlayerId(playerId);
      setRoomId(roomId);
      setRoomState(room);
      setPlayers(room.players);
      setIsHost(true);
      setScreen("WAITING_LOBBY");
      setErrorMsg("");
      window.history.pushState({}, "", `?room=${roomId}`);
    });

    socket.on("room_joined", ({ roomId, playerId, room }) => {
      setMyPlayerId(playerId);
      setRoomId(roomId);
      setRoomState(room);
      setPlayers(room.players);
      setIsHost(room.host === playerId);
      
      if (room.state === "LOBBY") {
        setScreen("WAITING_LOBBY");
      } else {
        setScreen("GAME_PLAY");
        setIsDrawer(room.currentDrawer === playerId);
        setHints(room.currentHint || "");
        setCategory(room.currentWord?.category || "");
        setWordLength(room.currentWord?.length || 0);
        setTimeLeft(room.remainingTime || 0);
      }

      setErrorMsg("");
      window.history.pushState({}, "", `?room=${roomId}`);
    });

    socket.on("player_joined", ({ player, players }) => {
      setPlayers(players);
      setChatMessages((prev) => [
        ...prev,
        { system: true, text: `Player ${player.username} joined the lobby!` }
      ]);
    });

    socket.on("player_left", ({ playerId, username, room }) => {
      setRoomState(room);
      setPlayers(room.players);
      setIsHost(room.host === myPlayerId);
      setChatMessages((prev) => [
        ...prev,
        { system: true, text: `Player ${username} has left the room.` }
      ]);
    });

    socket.on("settings_updated", ({ settings, room }) => {
      setRoomState(room);
    });

    socket.on("room_state", ({ room }) => {
      setRoomState(room);
      setPlayers(room.players);
      setIsHost(room.host === myPlayerId);

      if (room.currentDrawer) {
        setIsDrawer(room.currentDrawer === myPlayerId);
      } else {
        setIsDrawer(false);
      }

      if (room.state === "LOBBY") {
        setScreen("WAITING_LOBBY");
      }
    });

    socket.on("game_started", ({ room }) => {
      setScreen("GAME_PLAY");
      setRoomState(room);
      setChatMessages([{ system: true, text: "The game has started! Draw & guess!" }]);
    });

    socket.on("round_start", ({ drawerId, wordOptions: options, drawTime }) => {
      setChosenWordReveal("");
      setHints("");
      setCategory("");
      setHasGuessedCorrectly(false);

      const amIDrawer = drawerId === myPlayerId;
      setIsDrawer(amIDrawer);

      if (amIDrawer) {
        setWordOptions(options || []);
      } else {
        setWordOptions([]);
      }
    });

    socket.on("chosen_word_reveal", ({ word }) => {
      setChosenWordReveal(word);
    });

    socket.on("word_chosen", ({ drawerId, category, length, room }) => {
      setRoomState(room);
      setCategory(category);
      setWordLength(length);
      setWordOptions([]);
      setHints(room.currentHint || "_ ".repeat(length));
    });

    socket.on("timer_tick", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on("hint_update", ({ hint, category }) => {
      setHints(hint);
      if (category) setCategory(category);
    });

    socket.on("chat_message", (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on("guess_result", ({ correct, points, word }) => {
      if (correct) {
        setHasGuessedCorrectly(true);
        setChatMessages((prev) => [
          ...prev,
          { system: true, guessCorrect: true, text: `You guessed correctly! +${points} points` }
        ]);
        if (word) {
          setChosenWordReveal(word);
        }
      }
    });

    socket.on("round_end", ({ word, scores, nextDrawer, reason, room }) => {
      setRoomState(room);
      setPlayers(room.players);
      setChosenWordReveal(word);
      setChatMessages((prev) => [
        ...prev,
        { system: true, text: `Round Over! The word was '${word}'. ${reason}` }
      ]);
    });

    socket.on("game_over", ({ winner, leaderboard, room }) => {
      setRoomState(room);
      setPlayers(room.players);
      setIsHost(room.host === myPlayerId);
    });

    return () => {
      socket.off("connect");
      socket.off("error");
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("settings_updated");
      socket.off("room_state");
      socket.off("game_started");
      socket.off("round_start");
      socket.off("chosen_word_reveal");
      socket.off("word_chosen");
      socket.off("timer_tick");
      socket.off("hint_update");
      socket.off("chat_message");
      socket.off("guess_result");
      socket.off("round_end");
      socket.off("game_over");
    };
  }, [myPlayerId]);

  // ----------------------------------------------------------------
  // EMITTER TRIGGERS
  // ----------------------------------------------------------------
  const connectAndAction = (usernameVal, typeTab, maxP, rds, drawT, hintsE, wordM, lobbyType = "PRIVATE") => {
    if (!socket.connected) {
      socket.connect();
    }

    if (typeTab === "create") {
      socket.emit("create_room", {
        hostName: usernameVal,
        settings: {
          maxPlayers: maxP,
          rounds: rds,
          drawTime: drawT,
          hints: hintsE,
          wordMode: wordM,
          type: lobbyType
        }
      });
    } else {
      socket.emit("join_room", {
        roomId: roomId.trim().toUpperCase(),
        playerName: usernameVal
      });
    }
  };

  const joinPublicRoom = (usernameVal) => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join_public_room", { playerName: usernameVal });
  };

  const leaveRoom = () => {
    socket.emit("leave_room");
    setRoomId("");
    setRoomState(null);
    setPlayers([]);
    setIsHost(false);
    setIsDrawer(false);
    setWordOptions([]);
    setChosenWordReveal(null);
    setHints("");
    setCategory("");
    setWordLength(0);
    setTimeLeft(0);
    setChatMessages([]);
    setHasGuessedCorrectly(false);
    setScreen("LOBBY_SELECT");
    
    // Clear room query parameter from the URL address bar on exit
    window.history.pushState({}, "", window.location.pathname);
  };

  const toggleReady = () => {
    socket.emit("toggle_ready");
  };

  const updateSettings = (settings) => {
    socket.emit("update_settings", { settings });
  };

  const startGame = () => {
    socket.emit("start_game");
  };

  const chooseWord = (word) => {
    socket.emit("choose_word", { word, roomId, playerId: myPlayerId });
  };

  const sendGuess = (text) => {
    socket.emit("guess", { text });
  };

  const sendMessage = (text) => {
    socket.emit("chat_message", { text });
  };

  const playAgain = () => {
    socket.emit("play_again", { roomId, playerId: myPlayerId });
  };

  const value = {
    screen,
    setScreen,
    tab,
    setTab,
    errorMsg,
    setErrorMsg,
    username,
    setUsername,
    myPlayerId,
    roomId,
    setRoomId,
    roomState,
    players,
    isHost,
    isDrawer,
    wordOptions,
    chosenWordReveal,
    hints,
    category,
    wordLength,
    timeLeft,
    chatMessages,
    hasGuessedCorrectly,
    connectAndAction,
    joinPublicRoom,
    leaveRoom,
    toggleReady,
    updateSettings,
    startGame,
    chooseWord,
    sendGuess,
    sendMessage,
    playAgain
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
