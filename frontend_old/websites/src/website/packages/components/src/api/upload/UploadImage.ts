import { ApiConfig } from "../ApiConfig";

export interface UploadImageRequest {
  uuid_idempotency_token: string,
  source?: string, // eg. "device", "file"
  file: any,
}

export interface UploadImageSuccessResponse {
  success: boolean,
  upload_token: string,
}

export interface UploadImageErrorResponse {
  success: boolean,
}

type UploadImageResponse = UploadImageSuccessResponse | UploadImageErrorResponse;

export function UploadImageIsOk(response: UploadImageResponse): response is UploadImageSuccessResponse {
  return response?.success === true;
}

export function UploadImageIsError(response: UploadImageResponse): response is UploadImageErrorResponse {
  return response?.success === false;
}

export async function UploadImage(request: UploadImageRequest): Promise<UploadImageResponse> {
  const endpoint = new ApiConfig().uploadImage();

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
