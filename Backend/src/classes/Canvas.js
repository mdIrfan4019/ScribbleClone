import { randomUUID } from "crypto";

class Canvas {

    constructor() {

        this.strokes = [];

        this.currentStroke = null;

        this.version = 0;

    }

    /*
    ==========================================
            START NEW STROKE
    ==========================================
    */

    startStroke({

        tool = "brush",

        color = "#000000",

        size = 4,

        x,

        y

    }) {

        this.currentStroke = {

            id: randomUUID(),

            tool,

            color,

            size,

            points: [

                { x, y }

            ]

        };

    }

    /*
    ==========================================
            ADD POINT
    ==========================================
    */

    addPoint(x, y) {

        if (!this.currentStroke) return;

        this.currentStroke.points.push({

            x,

            y

        });

    }

    /*
    ==========================================
            END STROKE
    ==========================================
    */

    endStroke() {

        if (!this.currentStroke) return;

        this.strokes.push(this.currentStroke);

        this.currentStroke = null;

        this.version++;

    }

    /*
    ==========================================
            UNDO
    ==========================================
    */

    undo() {

        if (this.strokes.length === 0) return null;

        const removedStroke = this.strokes.pop();

        this.version++;

        return removedStroke;

    }

    /*
    ==========================================
            CLEAR CANVAS
    ==========================================
    */

    clear() {

        this.strokes = [];

        this.currentStroke = null;

        this.version++;

    }

    /*
    ==========================================
            RESET
    ==========================================
    */

    reset() {

        this.clear();

        this.version = 0;

    }

    /*
    ==========================================
            GET ALL STROKES
    ==========================================
    */

    getStrokes() {

        return this.strokes;

    }

    /*
    ==========================================
            LOAD STROKES
    ==========================================
    */

    load(strokes = []) {

        this.strokes = strokes;

        this.currentStroke = null;

        this.version++;

    }

    /*
    ==========================================
            SERIALIZE
    ==========================================
    */

    serialize() {

        return {

            version: this.version,

            strokes: this.strokes

        };

    }

}

export default Canvas;