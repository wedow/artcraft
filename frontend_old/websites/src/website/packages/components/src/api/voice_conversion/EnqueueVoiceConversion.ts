import { ApiConfig } from "@storyteller/components";

export enum EnqueueVoiceConversionFrequencyMethod {
  Rmvpe = "rmvpe",
  Crepe = "crepe",
  Dio = "dio",
  Harvest = "harvest",
}

export interface EnqueueVoiceConversionRequest {
  uuid_idempotency_token: string;
  voice_conversion_model_token: string;
  source_media_upload_token: string;

  // Optional args
  auto_predict_f0?: boolean;
  override_f0_method?: EnqueueVoiceConversionFrequencyMethod;
  transpose?: number;
}

export interface EnqueueVoiceConversionSuccessResponse {
  success: boolean;
  inference_job_token: string;
}

export interface EnqueueVoiceConversionErrorResponse {
  success: boolean;
}

export type EnqueueVoiceConversionResponse =
  | EnqueueVoiceConversionSuccessResponse
  | EnqueueVoiceConversionErrorResponse;

export function EnqueueVoiceConversionIsSuccess(
  response: EnqueueVoiceConversionResponse
): response is EnqueueVoiceConversionSuccessResponse {
  return response?.success === true;
}

export function EnqueueVoiceConversionIsError(
  response: EnqueueVoiceConversionResponse
): response is EnqueueVoiceConversionErrorResponse {
  return response?.success === false;
}

export async function EnqueueVoiceConversion(
  request: EnqueueVoiceConversionRequest
): Promise<EnqueueVoiceConversionResponse> {
  const endpoint = new ApiConfig().enqueueVoiceConversion();

  return await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  })
    .then(res => res.json())
    .then(res => {
      if (!res) {
        return { success: false };
      }

      if (res && "success" in res) {
        return res;
      } else {
        return { success: false };
      }
    })
    .catch(e => {
      return { success: false };
    });
}
