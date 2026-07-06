import words from "../data/words.json" with { type: "json" };

import { WORD_MODES } from "../constants/wordModes.js";

class WordManager {

    constructor() {
        this.wordList = words;
        this.currentWord = null;
        this.wordMode = WORD_MODES.NORMAL;
        this.revealedIndexes = new Set();
        this.availableChoices = [];
        this.usedWords = new Set(); // tracks used word IDs in this game session
    }

    /*
    ==========================================
            RANDOM WORD OPTIONS
    ==========================================
    */

    generateWordChoices(count = 3) {
        // Filter out words that have already been used
        let pool = this.wordList.filter(word => !this.usedWords.has(word.id));

        // If there are not enough unused words left, reset the used log
        if (pool.length < count) {
            this.usedWords.clear();
            pool = [...this.wordList];
        }

        // Shuffle the pool
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        this.availableChoices = shuffled.slice(0, count);
        return this.availableChoices;
    }

    /*
    ==========================================
            SELECT WORD
    ==========================================
    */

    selectWord(wordId) {
        const selected = this.availableChoices.find(word => word.id === wordId);
        if (!selected) {
            throw new Error("Invalid word selected.");
        }

        this.currentWord = selected;
        this.usedWords.add(selected.id); // mark as used
        this.revealedIndexes.clear();
        return selected;
    }

    setCurrentWord(word) {
        this.currentWord = word;
        this.usedWords.add(word.id); // mark as used
        this.revealedIndexes.clear();
    }

    setWordMode(mode) {
        this.wordMode = mode;
    }



    getMaskedWord() {

        if (!this.currentWord)

            return "";

        return [

            ...this.currentWord.word

        ]

            .map((char, index) => {

                if (char === " ")

                    return " ";

                return this.revealedIndexes.has(index)

                    ? char

                    : "_";

            })

            .join(" ");

    }

    revealNextHint() {

        if (!this.currentWord)

            return "";

        const word = this.currentWord.word;

        const hidden = [];

        for (

            let i = 0;

            i < word.length;

            i++

        ) {

            if (

                word[i] !== " "

                &&

                !this.revealedIndexes.has(i)

            ) {

                hidden.push(i);

            }

        }

        if (hidden.length === 0) {

            return this.getMaskedWord();

        }

        const randomIndex =

            hidden[

            Math.floor(

                Math.random() * hidden.length

            )

            ];

        this.revealedIndexes.add(

            randomIndex

        );

        return this.getMaskedWord();

    }



    /*
    ==========================================
            CHECK GUESS
    ==========================================
    */
    checkGuess(guess) {

        if (!this.currentWord)

            return false;

        return (

            guess

                .trim()

                .toLowerCase()

            ===

            this.currentWord.word

                .trim()

                .toLowerCase()

        );

    }



    /*
    ==========================================
            RESET
    ==========================================
    */

    reset() {

        this.currentWord = null;

        this.availableChoices = [];

        this.revealedIndexes.clear();

    }

    getRandomWords(count) {
        return this.generateWordChoices(count);
    }

    setCurrentWord(word) {
        this.currentWord = word;
        this.revealedIndexes.clear();
    }

    getCurrentWord() {
        return this.currentWord;
    }

    /*
    ==========================================
            SEND SAFE DATA
    ==========================================
    */

    serialize() {

        return {

            wordId:

                this.currentWord?.id,

            category:

                this.currentWord?.category,

            maskedWord:

                this.getMaskedWord(),

            revealedLetters:

                this.revealedIndexes.size

        };

    }

}

export default WordManager;