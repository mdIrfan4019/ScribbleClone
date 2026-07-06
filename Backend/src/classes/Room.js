import { randomUUID } from "crypto";


import Canvas from "./Canvas.js";
import Timer from "./Timer.js";
import WordManager from "./WordManager.js";
import { GAME_STATES } from "../constants/gameStates.js";
import { ROOM_TYPES } from "../constants/roomTypes.js";
import { WORD_MODES } from "../constants/wordModes.js";

class Room {

    constructor(hostPlayer, settings = {}) {

        this.roomId = randomUUID()
            .replace(/-/g, "")
            .substring(0, 6)
            .toUpperCase();

        this.type = settings.type || ROOM_TYPES.PRIVATE;

        this.host = hostPlayer;

        hostPlayer.setHost();

        this.players = new Map();

        this.players.set(hostPlayer.playerId, hostPlayer);

        this.state = GAME_STATES.LOBBY;

        this.settings = {

            maxPlayers: settings.maxPlayers || 8,

            rounds: settings.rounds || 3,

            drawTime: settings.drawTime || 60,

            wordChoices: settings.wordChoices || 3,

            hints: settings.hints ?? true,

            wordMode: settings.wordMode || WORD_MODES.NORMAL

        };

        /*
==========================================
        GAME ENGINE
==========================================
*/

        this.canvas = new Canvas();

        this.timer = new Timer(this.settings.drawTime);

        this.wordManager = new WordManager();

        this.currentRound = 0;

        this.currentDrawer = null;

        this.drawerIndex = -1;

        this.wordManager.reset();
        /*
==========================================
        WORD SELECTION
==========================================
*/

        this.wordOptions = [];

        this.wordChosen = false;

        this.currentHint = "";

        this.leaderboard = [];

        this.winner = null;

        this.gameStarted = false;

        this.gameFinished = false;

        /*
==========================================
        ROUND ENGINE
==========================================
*/

        this.roundStartTime = null;

        this.roundEndTime = null;

        this.roundWinner = null;

        /*
        ==========================================
                TIMER SETTINGS
        ==========================================
        */

        this.lastHintTime = 0;

        this.hintsGiven = 0;

        /*
==========================================
        HINT ENGINE
==========================================
*/

        this.hintsEnabled = this.settings.hints && this.settings.wordMode === WORD_MODES.NORMAL;

        this.maxHints = this.hintsEnabled
            ? Math.min(5, this.settings.hintsCount || 3)
            : 0;

        this.hintsGiven = 0;

        this.currentHint = "";

        this.createdAt = Date.now();

        this.updatedAt = Date.now();

    }

    updateTimestamp() {

        this.updatedAt = Date.now();

    }

    addPlayer(player) {

        if (this.isFull()) {

            throw new Error("Room is full.");

        }

        this.players.set(player.playerId, player);

        this.updateTimestamp();

    }

    removePlayer(playerId) {

        const player = this.players.get(playerId);

        if (!player) {

            return false;

        }

        const wasHost = player.isHost;

        this.players.delete(playerId);

        if (wasHost) {

            this.assignNewHost();

        }

        this.updateTimestamp();

        return true;

    }

    assignNewHost() {

        if (this.players.size === 0) {

            this.host = null;

            return;

        }

        this.players.forEach(player => {

            player.removeHost();

        });

        const nextHost = this.players.values().next().value;

        nextHost.setHost();

        this.host = nextHost;

    }

    getPlayer(playerId) {

        return this.players.get(playerId);

    }

    hasPlayer(playerId) {

        return this.players.has(playerId);

    }

    getPlayers() {

        return [...this.players.values()];

    }

    getPlayerCount() {

        return this.players.size;

    }

    isFull() {

        return this.players.size >= this.settings.maxPlayers;

    }

    isEmpty() {

        return this.players.size === 0;

    }

    allPlayersReady() {

        return [...this.players.values()].every(

            player => player.isReady

        );

    }

    resetReadyStatus() {

        this.players.forEach(player => {

            player.setNotReady();

        });

    }

    updateSettings(newSettings = {}) {

        this.settings = {

            ...this.settings,

            ...newSettings

        };

        this.updateTimestamp();

    }

    changeState(state) {

        this.state = state;

        this.updateTimestamp();

    }

    endGame() {

        this.gameFinished = true;

        this.gameStarted = false;

        this.changeState(GAME_STATES.GAME_OVER);

    }

    isGameRunning() {

        return this.gameStarted && !this.gameFinished;

    }


    getCurrentDrawer() {

        return this.currentDrawer;

    }

    selectNextDrawer() {

        const players = this.getPlayers();

        if (players.length === 0) {

            return null;

        }

        if (this.currentDrawer) {

            this.currentDrawer.removeDrawer();

        }

        this.drawerIndex =

            (this.drawerIndex + 1) %

            players.length;

        this.currentDrawer =

            players[this.drawerIndex];

        this.currentDrawer.setDrawer();

        return this.currentDrawer;

    }

    nextRound() {

        this.currentRound++;

        if (

            this.currentRound >

            this.settings.rounds

        ) {

            this.endGame();

            return;

        }

        this.changeState(

            GAME_STATES.WORD_SELECTION

        );

    }

    updateLeaderboard() {

        this.leaderboard =

            this.getPlayers()

                .sort(

                    (a, b) =>

                        b.score - a.score

                );

    }

    calculateWinner() {

        this.updateLeaderboard();

        this.winner =

            this.leaderboard[0] || null;

        return this.winner;

    }

    resetRound() {

        this.clearWord();

        this.canvas.reset();

        this.timer.reset(this.settings.drawTime);
        this.hintsGiven = 0;

        this.currentHint = "";

        this.lastHintTime = 0;

        this.players.forEach(player => {

            player.resetRound();

        });

    }

    resetGame() {

        this.gameStarted = false;

        this.gameFinished = false;

        this.currentRound = 0;

        this.drawerIndex = -1;

        this.currentDrawer = null;

        this.clearWord();

        this.winner = null;

        this.changeState(

            GAME_STATES.LOBBY

        );

        this.canvas.reset();

        this.timer.reset(this.settings.drawTime);


        this.players.forEach(player => {

            player.resetGame();

        });

    }

    /*
==========================================
        GENERATE WORD OPTIONS
==========================================
*/

    generateWordOptions() {

        this.wordOptions = this.wordManager.getRandomWords(

            this.settings.wordChoices

        );

        this.wordChosen = false;

        return this.wordOptions;

    }

    /*
    ==========================================
            SELECT WORD
    ==========================================
    */

    chooseWord(word) {

        const selectedWord = this.wordOptions.find(

            option =>

                option.word === word

        );

        if (!selectedWord) {

            throw new Error(

                "Invalid word selected."

            );

        }

        this.wordManager.setCurrentWord(

            selectedWord

        );

        this.currentWord = selectedWord;

        // Dynamically calculate maximum hints based on secret word length
        if (this.hintsEnabled) {
            this.maxHints = Math.max(1, Math.min(5, selectedWord.word.length - 1));
        } else {
            this.maxHints = 0;
        }
        this.hintsGiven = 0;

        this.wordChosen = true;

        this.currentHint = this.getHiddenWord();

        // Automatically begin the drawing phase
        this.beginDrawingPhase();

        return selectedWord;

    }

    /*
    ==========================================
            HIDDEN WORD
    ==========================================
    */

    getHiddenWord() {
        if (!this.wordManager.getCurrentWord()) {
            return "";
        }
        if (this.settings.wordMode === WORD_MODES.HIDDEN) {
            return "?";
        }
        return this.wordManager.getCurrentWord().word
            .split("")
            .map(letter => letter === " " ? " " : "_")
            .join(" ");
    }

    /*
    ==========================================
            DRAWER WORD
    ==========================================
    */

    getDrawerWord() {

        return this.wordManager.getCurrentWord();

    }

    /*
    ==========================================
            GUESSER WORD
    ==========================================
    */

    getGuesserWord() {

        return {

            hint: this.currentHint,

            length:

                this.currentWord?.word.length || 0,

            category:

                this.currentWord?.category || ""

        };

    }

    /*
    ==========================================
            WORD SELECTED
    ==========================================
    */

    hasChosenWord() {

        return this.wordChosen;

    }

    /*
    ==========================================
            CLEAR WORD
    ==========================================
    */

    clearWord() {

        this.currentWord = null;

        this.wordOptions = [];

        this.wordChosen = false;

        this.currentHint = "";

        this.wordManager.reset();

    }


    /*
    ==========================================
            INITIALIZE ROUND
    ==========================================
    */

    initializeRound() {

        this.resetRound();

        this.selectNextDrawer();

        this.generateWordOptions();

        this.changeState(

            GAME_STATES.WORD_SELECTION

        );

    }

    startGame() {

        if (this.players.size < 2) {

            throw new Error(

                "Minimum 2 players required."

            );

        }

        this.gameStarted = true;

        this.gameFinished = false;

        this.currentRound = 1;

        this.initializeRound();

    }

    /*
    ==========================================
            BEGIN DRAWING PHASE
    ==========================================
    */

    beginDrawingPhase() {

        if (!this.wordChosen) {

            throw new Error("Word has not been selected.");

        }

        this.roundStartTime = Date.now();

        this.changeState(GAME_STATES.DRAWING);

        this.timer.reset(this.settings.drawTime);

        this.timer.start();

    }

    /*
    ==========================================
            END ROUND
    ==========================================
    */

    endRound() {

        this.timer.stop();

        this.roundEndTime = Date.now();

        this.changeState(GAME_STATES.ROUND_END);

        this.updateLeaderboard();

    }

    /*
    ==========================================
            PREPARE NEXT ROUND
    ==========================================
    */

    prepareNextRound() {

        if (

            this.currentRound >=

            this.settings.rounds

        ) {

            this.finishGame();

            return;

        }

        this.currentRound++;

        this.initializeRound();

    }

    /*
    ==========================================
            FINISH GAME
    ==========================================
    */

    finishGame() {

        this.calculateWinner();

        this.endGame();

    }

    /*
    ==========================================
            CURRENT PHASE
    ==========================================
    */

    getCurrentPhase() {

        return this.state;

    }

    /*
    ==========================================
            CAN DRAW
    ==========================================
    */

    canDraw(playerId) {

        if (!this.currentDrawer) {

            return false;

        }

        return (

            this.currentDrawer.playerId ===

            playerId

        );

    }
    /*
    ==========================================
            CAN GUESS
    ==========================================
    */

    canGuess(playerId) {

        if (!this.currentDrawer) {

            return false;

        }

        return (

            this.currentDrawer.playerId !==

            playerId

        );

    }

    /*
    ==========================================
            ROUND INFO
    ==========================================
    */

    getRoundInfo() {

        return {

            round: this.currentRound,

            totalRounds: this.settings.rounds,

            drawer: this.currentDrawer?.playerId,

            phase: this.state,

            remainingTime: this.getRemainingTime(),

            hint: this.currentHint

        };

    }

    /*
    ==========================================
            UPDATE ROUND
    ==========================================
    */

    updateRound() {

        if (!this.timer.isRunning) {

            return;

        }

        const remaining = this.timer.getTimeLeft();

        if (remaining <= 0) {

            this.endRound();

            return;

        }

        this.checkHintProgress();

    }

    /*
    ==========================================
            CHECK HINTS
    ==========================================
    */

    /*
==========================================
        UPDATE HINT PROGRESS
==========================================
*/

    checkHintProgress() {

        if (!this.hintsEnabled) {

            return;

        }

        const elapsed =

            this.settings.drawTime -

            this.timer.getTimeLeft();

        const interval =

            this.getHintInterval();

        if (!interval) return;

        const expectedHints =

            Math.floor(elapsed / interval);

        while (
            this.hintsGiven < expectedHints &&
            this.hintsGiven < this.maxHints
        ) {
            this.revealNextHint();
        }

    }

    /*
==========================================
        GET REMAINING TIME
==========================================
*/

    getRemainingTime() {

        return this.timer.getTimeLeft();

    }


    /*
==========================================
        HINT INTERVAL
==========================================
*/

    getHintInterval() {

        if (!this.hintsEnabled || this.maxHints === 0) {

            return null;

        }

        return Math.floor(

            this.settings.drawTime /

            (this.maxHints + 1)

        );

    }

    /*
    ==========================================
            REVEAL NEXT HINT
    ==========================================
    */

    revealNextHint() {

        if (!this.hintsEnabled) {

            return null;

        }

        if (

            this.hintsGiven >=

            this.maxHints

        ) {

            return this.currentHint;

        }

        this.currentHint =

            this.wordManager.revealNextHint();

        this.hintsGiven++;

        return this.currentHint;

    }

    /*
    ==========================================
            WORD FOR PLAYER
    ==========================================
    */

    getWordForPlayer(playerId) {
        if (
            this.currentDrawer &&
            this.currentDrawer.playerId === playerId
        ) {
            return {
                drawer: true,
                word: this.currentWord.word,
                category: this.wordManager.getCurrentWord()?.category || ""
            };
        }

        const isHidden = this.settings.wordMode === WORD_MODES.HIDDEN;
        return {
            drawer: false,
            hint: isHidden ? "?" : this.currentHint,
            category: this.currentWord.category,
            length: isHidden ? 0 : this.currentWord.word.length
        };
    }

    toJSON() {

        return {

            roomId: this.roomId,

            type: this.type,

            state: this.state,

            host: this.host?.playerId,

            currentRound: this.currentRound,

            currentDrawer: this.currentDrawer?.playerId,

            gameStarted: this.gameStarted,

            gameFinished: this.gameFinished,

            winner: this.winner?.playerId,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt,

            settings: this.settings,

            playerCount: this.players.size,
            wordChosen: this.wordChosen,

            currentHint: this.currentHint,
            roundStartTime: this.roundStartTime,

            roundEndTime: this.roundEndTime,

            roundInfo: this.getRoundInfo(),
            remainingTime: this.getRemainingTime(),
            hint: this.currentHint,

            hintsGiven: this.hintsGiven,

            maxHints: this.maxHints,
            leaderboard: this.leaderboard.map(

                player => player.toJSON()

            ),

            players: this.getPlayers().map(

                player => player.toJSON()

            )


        };

    }

}

export default Room;