import { ApiConfig } from "../ApiConfig";

export interface UploadAudioRequest {
  uuid_idempotency_token: string,
  source?: string, // eg. "device", "file"
  file: any,
}

export interface UploadAudioSuccessResponse {
  success: boolean,
  upload_token: string,
}

export interface UploadAudioErrorResponse {
  success: boolean,
}

type UploadAudioResponse = UploadAudioSuccessResponse | UploadAudioErrorResponse;

export function UploadAudioIsOk(response: UploadAudioResponse): response is UploadAudioSuccessResponse {
  return response?.success === true;
}

export function UploadAudioIsError(response: UploadAudioResponse): response is UploadAudioErrorResponse {
  return response?.success === false;
}

export async function UploadAudio(request: UploadAudioRequest): Promise<UploadAudioResponse> {
  const endpoint = new ApiConfig().uploadAudio();

  const formData = new FormData();

  formData.append('uuid_idempotency_token', request.uuid_idempotency_token);
  formData.append('file', request.file);

  if (request.source !== undefined) {
    formData.append('source', request.source);
  }

  return fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
    body: formData,
  })
    .then(res => res.json())
    .then(res => {
      if (res && 'success' in res) {
        return res;
      } else {
        // @ts-ignore
        window.dataLayer.push({
          'event': 'upload_failure',
          'page': '/face-animator',
          'user_id': '$user_id'
        });
        return { success: false };
      }
    })
    .catch(e => {
      return { success: false };
    });
}
