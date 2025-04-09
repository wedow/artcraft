import { ApiConfig } from "../ApiConfig";

export interface EnqueueImageGenRequest {
  uuid_idempotency_token: string;
  maybe_sd_model_token: string | null;
  maybe_lora_model_token: string | null;
  maybe_prompt: string;
  maybe_n_prompt: string;
  maybe_seed: number;
  maybe_width: number;
  maybe_height: number;
  maybe_sampler: string;
  maybe_cfg_scale: number;
  maybe_number_of_samples: number;
  maybe_batch_count: number;
  // title: string;
  // description: string;
}

export interface EnqueueImageGenResponse {
  success: boolean;
  inference_job_token?: string;
}

const EnqueueImageGenIsSuccess = (response: EnqueueImageGenResponse) =>
  response.inference_job_token;
const EnqueueImageGenIsError = (response: EnqueueImageGenResponse) =>
  !response.inference_job_token;

export { EnqueueImageGenIsSuccess, EnqueueImageGenIsError };

export async function EnqueueImageGen(
  request: EnqueueImageGenRequest
): Promise<EnqueueImageGenResponse> {
  const endpoint = new ApiConfig().enqueueImageGeneration();

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
