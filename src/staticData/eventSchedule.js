
const { ISingleton, IJsonable } = require("../utils/helperClasses.js");

class SkyEventScheduleEntry extends IJsonable {
  static deserialize(obj) {
    var result = new SkyEventScheduleEntry()
      , duration;

    if (typeof obj !== "object")
      return result;

    result.name = obj.name || "";
    result.when = obj.when || [];

    duration = Number(obj.duration);
    result.duration = Number.isNaN(duration) ? 0 : duration;

    return result;
  }

  constructor() {
    super();

    this.name = "";
    this.duration = 0;
    this.when = [];
  }

  serialize() {
    return {
      "duration": this.duration.toString(),
      "name": this.name,
      "when": this.when
    }
  }
}

class SkyEventSchedule extends ISingleton {
  constructor() {
    super();

    this.events = new Map();
    this.baseTime = 0;

    this.dirtyMark = false;
    this.jsonData = {};
  }

  dirty() {
    this.dirtyMark = true;
  }

  initWithJson(obj) {
    if (typeof obj !== "object" || !obj.event_schedule)
      return;

    var defs = obj.event_schedule.events;

    this.dirty();
    this.events.clear();
    this.baseTime = obj.event_schedule.base_time || 0;

    for (var item of defs) {
      var entry = SkyEventScheduleEntry.deserialize(item);

      if (entry.name === "")
        continue;

      this.events.set(entry.name, entry);
    }

    return this;
  }

  toJSON() {
    if (!this.dirtyMark)
      return this.jsonData;

    var result = [];

    

    

    for (var v of this.events.values())
      result.push(v.serialize());

    this.dirtyMark = false;
    this.jsonData = {
      "base_time": this.baseTime,
      "events": result
    };

    return this.jsonData;
  }
}

module.exports = {
  SkyEventScheduleEntry,
  SkyEventSchedule
};
