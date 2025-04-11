import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import testUpdateDeleteEndpoints from "./utils/testUpdateDeleteEndpoints";
import { VoiceConversionApi } from "~/Classes/ApiManager/VoiceConversionApi";

EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });

describe("VoiceConversionApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
  });
  describe("run tests", () => {
    const api = new VoiceConversionApi();
    [
      {
        name: "PostAnalytics",
        function: api.ConvertVoice.bind(api),
        endpoint: "http://localhost:3000/v1/voice_conversion/inference",
        method: "POST",
        hasFailure: true,
        paramsIn: {
          autoPredictF0: true,
          creatorSetVisibility: "public",
          isStorytellerDemo: true,
          overrideF0Method: "rmvpe",
          sourceMediaUploadToken: "sourceToken123",
          transpose: 2,
          uuidIdempotencyToken: "uuid-1234-5678",
          voiceConversionModelToken: "voiceModelToken123",
        },
        paramsTest: {
          auto_predict_f0: true,
          creator_set_visibility: "public",
          is_storyteller_demo: true,
          override_f0_method: "rmvpe",
          source_media_upload_token: "sourceToken123",
          transpose: 2,
          uuid_idempotency_token: "uuid-1234-5678",
          voice_conversion_model_token: "voiceModelToken123",
        },
        response: { inference_job_token: "ijt1" },
        data: "ijt1",
      },
    ].forEach((testMethod) => {
      testUpdateDeleteEndpoints(api, testMethod);
    });
  });
});
