class Timer {

    constructor(duration = 60) {

        this.duration = duration;

        this.timeLeft = duration;

        this.interval = null;

        this.isRunning = false;

        this.isPaused = false;

        this.onTick = null;

        this.onComplete = null;

    }

    /*
    ==========================================
            START TIMER
    ==========================================
    */

    start(onTick = null, onComplete = null) {

        if (this.isRunning) return;

        this.onTick = onTick;

        this.onComplete = onComplete;

        this.isRunning = true;

        this.isPaused = false;

        this.interval = setInterval(() => {

            this.timeLeft--;

            if (this.onTick) {

                this.onTick(this.timeLeft);

            }

            if (this.timeLeft <= 0) {

                this.stop();

                if (this.onComplete) {

                    this.onComplete();

                }

            }

        }, 1000);

    }

    /*
    ==========================================
            PAUSE TIMER
    ==========================================
    */

    pause() {

        if (!this.isRunning) return;

        clearInterval(this.interval);

        this.interval = null;

        this.isRunning = false;

        this.isPaused = true;

    }

    /*
    ==========================================
            RESUME TIMER
    ==========================================
    */

    resume() {

        if (!this.isPaused) return;

        this.start(this.onTick, this.onComplete);

    }

    /*
    ==========================================
            STOP TIMER
    ==========================================
    */

    stop() {

        clearInterval(this.interval);

        this.interval = null;

        this.isRunning = false;

        this.isPaused = false;

    }

    /*
    ==========================================
            RESET TIMER
    ==========================================
    */

    reset(duration = this.duration) {

        this.stop();

        this.duration = duration;

        this.timeLeft = duration;

    }

    /*
    ==========================================
            CHANGE DURATION
    ==========================================
    */

    setDuration(duration) {

        this.duration = duration;

        this.timeLeft = duration;

    }

    /*
    ==========================================
            GET REMAINING TIME
    ==========================================
    */

    getTimeLeft() {

        return this.timeLeft;

    }

    /*
    ==========================================
            GET TIMER STATUS
    ==========================================
    */

    getStatus() {

        return {

            duration: this.duration,

            timeLeft: this.timeLeft,

            isRunning: this.isRunning,

            isPaused: this.isPaused

        };

    }

}

export default Timer;