
const { CronJob } = require("cron");
const { ISingleton } = require("../utils/helperClasses");

class SkyServerTimer extends ISingleton {
  constructor() {
    super();

    this.timeZone = "UTC+8";

    this.timers = new Map();
    this.inteval = new Map();
    this.inc = 0;

    this.seconds = null;
  }

  /**
   * Internal function.
   */
  dispatchIntevalEvents() {
    for (var fn of this.inteval.values()) {
      if (fn.time >= fn.inteval) {
        fn.time = 0;
        if (typeof fn.callback === "function")
          fn.callback();
      }
      fn.time++;
    }
  }

  /**
   * Set the timezone.
   * @param {number} timeZone 
   * @returns 
   */
  setTimeZone(timeZone) {
    if (typeof timeZone !== "number")
      return false;

    timeZone = Math.floor(timeZone);
    timeZone %= 24;
    this.timeZone = "UTC";
    this.timeZone += timeZone > 0 ? "+" : "";
    this.timeZone += timeZone;

    return true;
  }

  /**
   * Register a cron timer.
   * @param {string} cronTime 
   * @param {Function} onTick 
   * @returns {number}
   */
  register(cronTime, onTick) {
    var job = CronJob.from({
      cronTime: cronTime,
      onTick: onTick,
      start: true,
      timeZone: this.timeZone,
    })
      , id = this.inc;

    this.timers.set(id, job);
    this.inc++;

    return id;
  }

  /**
   * Register an event called every "second" seconds.
   * @param {number} second 
   * @param {Function} onTick 
   */
  every(second, onTick) {
    if (!this.seconds)
      this.seconds = CronJob.from({
        cronTime: "* * * * * *",
        onTick: this.dispatchIntevalEvents.bind(this),
        start: true,
        timeZone: this.timeZone,
      });

    var id = this.inc;
    this.inteval.set(id, {
      callback: onTick,
      time: second,
      inteval: second
    });

    return id;
  }

  /**
   * Unregister a timer.
   * @param {number} timer 
   * @returns {boolean}
   */
  unregister(timer) {
    var job = this.timers.get(timer);
    if (job) {
      job.stop();
      return true;
    }

    var event = this.inteval.get(timer);
    if (event) {
      this.inteval.delete(event);
      return true;
    }

    return false;
  }
}

module.exports = {
  SkyServerTimer
};
