
const { SkyEventSchedule } = require("../../../../staticData/eventSchedule.js");
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");

class AccountGetEventScheduleResponse extends NetServerSimpleResponse {
  template() {
    

    

    

    var schedule = {
      

      

      base_time: 1587366000,
      events: []
    };

    

    try {
      const { SkyServerStore } = require("../../../../runtimeData/db.js");
      var raw = SkyServerStore.singleton().getString("admin_events");
      if (raw) {
        var customEvents = JSON.parse(raw);
        if (Array.isArray(customEvents)) {
          var converted = customEvents.map(e => ({
            duration: String(e.duration || 1440),
            name: e.name || "event",
            when: Array.isArray(e.when) ? e.when : [0]
          }));
          schedule.events = converted;
        }
      }
    } catch (e) { console.error("event schedule error:", e); }

    return { "event_schedule": schedule };
  }
}

class AccountGetEventScheduleRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/get_event_schedule";
  }

  static get response() {
    return AccountGetEventScheduleResponse;
  }
}

module.exports = AccountGetEventScheduleRequest;