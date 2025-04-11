import { ApiManager, ApiResponse } from "./ApiManager";

export class EngineApi extends ApiManager {
  public async ConvertTbxToGltf({
    mediaFileToken,
    uuidIdempotencyToken,
  }: {
    mediaFileToken: string;
    uuidIdempotencyToken: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/conversion/enqueue_fbx_to_gltf`;

    const body = {
      media_file_token: mediaFileToken,
      uuid_idempotency_token: uuidIdempotencyToken,
    };

    return this.post<
      { media_file_token: string; uuid_idempotency_token: string },
      { success?: boolean; inference_job_token?: string; BadInput?: string }
    >({
      endpoint,
      body: body,
    })
      .then((response) => {
        return {
          success: response.success ?? false,
          data: response.inference_job_token,
          errorMessage: response.BadInput,
        };
      })
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }
}
