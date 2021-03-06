class Timer {
  constructor(callback, delay) {
    this.timerID;
    this.remaining = delay;
    this.start;
    this.running;
    this.callback = callback;

    this.pause = () => {
      this.running = false;
      clearTimeout(this.timerID);
      this.remaining -= new Date() - this.start;
    };

    this.resume = () => {
      this.running = true;
      this.start = new Date();
      this.timerID = setTimeout(this.callback, this.remaining);
    };

    this.getTimeLeft = () => {
      if (this.running === true) {
        return this.remaining - (new Date() - this.start);
      }
      return this.remaining;
    };
  }
}

module.exports = {Timer};
