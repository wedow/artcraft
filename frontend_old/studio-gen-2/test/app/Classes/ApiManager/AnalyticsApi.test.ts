import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { AnalyticsApi } from "~/Classes/ApiManager/AnalyticsApi";
import testUpdateDeleteEndpoints from "./utils/testUpdateDeleteEndpoints";

EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });

describe("AnalyticsApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
  });
  describe("run tests", () => {
    const api = new AnalyticsApi();
    [
      {
        name: "PostAnalytics",
        function: api.PostAnalytics.bind(api),
        endpoint: "http://localhost:3000/v1/analytics/log_session",
        method: "POST",
        paramsIn: {
          maybeLastAction: "mla1",
          maybeLogToken: "mlt1",
        },
        paramsTest: {
          maybe_last_action: "mla1",
          maybe_log_token: "mlt1",
        },
        response: { success: true, log_token: "lt1" },
        data: "lt1",
      },
    ].forEach((testMethod) => {
      testUpdateDeleteEndpoints(api, testMethod);
    });
  });
});
