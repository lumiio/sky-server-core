
const { SkyVars } = require("../../../../staticData/vars.js");
const {
  NetServerSimpleRequest,
  NetServerSimpleResponse
} = require("../../netServerRequest.js");

class AccountGetVarsResponse extends NetServerSimpleResponse {
  template() {
    var vars = SkyVars.singleton().toJSON();

    

    vars["TUTORIAL_COMPLETE"] = true;
    vars["NEW_USER_EXPERIENCE_DISABLED"] = true;
    vars["SKIP_INTRO"] = true;
    vars["enable_autoskip_cutscenes"] = 1;

    

    vars["story_space_reroute_override"] = 0;
    vars["welcome"] = "8d1a1882-cfb8-4c00-a134-daa449388799";
    vars["enable_nest_home_choice"] = 1;

    

    vars["daily_candle_cap"] = 9999;
    vars["daily_candle_limit"] = 9999;
    vars["candle_daily_cap"] = 9999;
    vars["max_daily_candles"] = 9999;

    

    

    vars["level_storm"] = 1;
    vars["mainstreet_spirit_dailies"] = 1;
    vars["onboarding_mainstreet_00"] = 1;
    vars["past_collectibles_enabled"] = 1;
    vars["beta_mode"] = 1;
    vars["c_max_friend_pages"] = 10;

    return { "vars": vars };
  }
}

class AccountGetVarsRequest extends NetServerSimpleRequest {
  static get PATH() {
    return "/account/get_vars";
  }

  static get response() {
    return AccountGetVarsResponse;
  }
}

module.exports = AccountGetVarsRequest;
