import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import testUpdateDeleteEndpoints from "./utils/testUpdateDeleteEndpoints";
import { VoiceDesignerApi } from "~/Classes/ApiManager/VoiceDesignerApi";
import testListEndpoints from "./utils/testListEndpoints";

const mockDataset = {
  created_at: "2024-06-18T11:11:03.533Z",
  creator: {
    default_avatar: {
      color_index: 3,
      image_index: 1,
    },
    display_name: "JaneDoe",
    gravatar_hash: "b1c967db4babc4eebc51abfa7a3e74d5",
    user_token: "user-token-9876",
    username: "janedoe",
  },
  creator_set_visibility: "private",
  dataset_token: "dataset-token-456",
  ietf_language_tag: "fr-FR",
  ietf_primary_language_subtag: "fr",
  title: "French Language Dataset",
  updated_at: "2024-06-18T12:15:30.000Z",
};

EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });

describe("VoiceDesignerApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
  });
  describe("run tests", () => {
    const api = new VoiceDesignerApi();
    [
      {
        name: "PostAnalytics",
        function: api.EnqueueTts.bind(api),
        endpoint: "http://localhost:3000/v1/voice_designer/enqueue_tts",
        method: "POST",
        hasFailure: true,
        paramsIn: {
          text: "Sample text 1",
          uuidIdempotencyToken: "uuid-1234-5678-abcdef",
          voiceToken: "voice-token-1",
        },
        paramsTest: {
          text: "Sample text 1",
          uuid_idempotency_token: "uuid-1234-5678-abcdef",
          voice_token: "voice-token-1",
        },
        response: { inference_job_token: "ijt1", voice_token: "vt1" },
        data: { inference_job_token: "ijt1", voice_token: "vt1" },
      },
    ].forEach((testMethod) => {
      testUpdateDeleteEndpoints(api, testMethod);
    });
  });

  describe("run list tests", () => {
    const api = new VoiceDesignerApi();
    [
      {
        name: "ListWeightsByUser",
        function: api.ListDatasetsByUser.bind(api),
        tests: [
          {
            name: "no user",
            endpoint: "http://localhost:3000/v1/voice_designer/user/un1/list",
            query: {},
            fetchQuery: undefined,
            response: { datasets: [mockDataset] },
            data: [mockDataset],
          },
          {
            name: "user",
            endpoint: "http://localhost:3000/v1/voice_designer/user/user1/list",
            query: { username: "user1" },
            fetchQuery: undefined,
            response: { datasets: [mockDataset] },
            data: [mockDataset],
          },
        ],
      },
    ].forEach((testMethod) => {
      testListEndpoints(api, testMethod);
    });
  });
});
