import words from "../data/words.json" assert { type: "json" };

class WordManager {

    constructor() {

        this.wordList = words;

        this.currentWord = null;

        this.revealedIndexes = new Set();

    }

    /*
    ==========================================
            RANDOM WORD OPTIONS
    ==========================================
    */

    getRandomWords(count = 3) {

        const shuffled = [...this.wordList]
            .sort(() => Math.random() - 0.5);

        return shuffled.slice(0, count);

    }

    /*
    ==========================================
            SELECT WORD
    ==========================================
    */

    setCurrentWord(wordObject) {

        this.currentWord = wordObject;

        this.revealedIndexes.clear();

    }

    /*
    ==========================================
            GET CURRENT WORD
    ==========================================
    */

    getCurrentWord() {

        return this.currentWord;

    }

    /*
    ==========================================
            CHECK GUESS
    ==========================================
    */

    checkGuess(guess) {

        if (!this.currentWord) return false;

        return (

            guess.trim().toLowerCase() ===

            this.currentWord.word.trim().toLowerCase()

        );

    }

    /*
    ==========================================
            GENERATE HINT
    ==========================================
    */

    generateHint() {

        if (!this.currentWord) return "";

        const word = this.currentWord.word;

        const hidden = [...word];

        while (

            this.revealedIndexes.size < word.length

        ) {

            const index = Math.floor(

                Math.random() * word.length

            );

            if (

                word[index] !== " " &&

                !this.revealedIndexes.has(index)

            ) {

                this.revealedIndexes.add(index);

                break;

            }

        }

        return hidden

            .map((char, index) =>

                char === " "

                    ? " "

                    : this.revealedIndexes.has(index)

                    ? char

                    : "_"

            )

            .join(" ");

    }

    /*
    ==========================================
            RESET
    ==========================================
    */

    reset() {

        this.currentWord = null;

        this.revealedIndexes.clear();

    }

    /*
    ==========================================
            SEND SAFE DATA
    ==========================================
    */

    toJSON() {

        if (!this.currentWord) {

            return null;

        }

        return {

            category: this.currentWord.category,

            length: this.currentWord.word.length

        };

    }

}

export default WordManager;