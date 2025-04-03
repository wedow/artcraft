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

  public async uploadSceneSnapshot({
    screenshot,
    sceneMediaToken,
  }: {
    screenshot: string; // base64 encoded PNG
    sceneMediaToken?: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/image_studio/scene_snapshot`;

    const formData = new FormData();
    formData.append("screenshot", screenshot);
    if (sceneMediaToken) {
      formData.append("scene_media_token", sceneMediaToken);
    }

    return this.post<
      FormData,
      { success?: boolean; snapshot_media_token?: string; BadInput?: string }
    >({
      endpoint,
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((response) => {
        return {
          success: response.success ?? false,
          data: response.snapshot_media_token,
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

  public async enqueueImageGeneration({
    prompt,
    sceneMediaToken,
    additionalImages,
  }: {
    prompt: string;
    sceneMediaToken: string;
    additionalImages?: string[];
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/image_studio/prompt`;

    const body = {
      prompt,
      scene_media_token: sceneMediaToken,
      additional_images: additionalImages,
    };

    return this.post<
      {
        prompt: string;
        scene_media_token: string;
        additional_images?: string[];
      },
      { success?: boolean; job_token?: string; BadInput?: string }
    >({
      endpoint,
      body,
    })
      .then((response) => {
        return {
          success: response.success ?? false,
          data: response.job_token,
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

  public async pollJobSession(jobToken: string): Promise<ApiResponse<any>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/jobs/session/${jobToken}`;

    return this.get<{
      success?: boolean;
      status?: string;
      result?: any;
      BadInput?: string;
    }>({
      endpoint,
    })
      .then((response) => {
        return {
          success: response.success ?? false,
          data: response.result,
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

  public async pollStudioSessionJobs(
    jobToken: string,
  ): Promise<ApiResponse<any>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/image_studio/session_jobs/${jobToken}`;

    return this.get<{
      success?: boolean;
      status?: string;
      result?: any;
      BadInput?: string;
    }>({
      endpoint,
    })
      .then((response) => {
        return {
          success: response.success ?? false,
          data: response.result,
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
