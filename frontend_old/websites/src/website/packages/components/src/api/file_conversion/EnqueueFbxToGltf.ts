import { ApiConfig } from "../ApiConfig";

export interface EnqueueFbxToGltfRequest {
  media_file_token: string;
  uuid_idempotency_token: string;
}

export interface EnqueueFbxToGltfResponse {
  success: boolean;
  inference_job_token?: string;
}

const EnqueueFbxToGltfIsSuccess = (response: EnqueueFbxToGltfResponse) =>
  response.inference_job_token;
const EnqueueFbxToGltfIsError = (response: EnqueueFbxToGltfResponse) =>
  !response.inference_job_token;

export { EnqueueFbxToGltfIsSuccess, EnqueueFbxToGltfIsError };

export async function EnqueueFbxToGltf(
  request: EnqueueFbxToGltfRequest
): Promise<EnqueueFbxToGltfResponse> {
  const endpoint = new ApiConfig().enqueueFbxToGltf();

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
