import { ApiConfig } from "@storyteller/components";

export interface AudioSource {
  maybe_media_file_token?: string,
  maybe_media_upload_token?: string,
  maybe_tts_result_token?: string,
  maybe_voice_conversion_result_token?: string,
}

export interface ImageSource {
  maybe_media_file_token?: string,
  maybe_media_upload_token?: string,
}


export interface EnqueueFaceAnimationRequest {
  uuid_idempotency_token: string,

  audio_source: AudioSource,
  image_source: ImageSource,

  dimensions?: string,

  make_still?: boolean,
  disable_face_enhancement?: boolean,
  remove_watermark?: boolean,
}

// export interface EnqueueFaceAnimationSuccessResponse {
//   success: boolean,
//   inference_job_token: string,
// }

// export interface EnqueueFaceAnimationErrorResponse {
//   success: boolean,
// }

export interface EnqueueFaceAnimationResponse {
  success: boolean,
  inference_job_token?: string,
}


const EnqueueFaceAnimationIsSuccess = (response: EnqueueFaceAnimationResponse) => response.inference_job_token;
const EnqueueFaceAnimationIsError = (response: EnqueueFaceAnimationResponse) => !response.inference_job_token;

export { EnqueueFaceAnimationIsSuccess, EnqueueFaceAnimationIsError };
// export EnqueueFaceAnimationIsSuccess;
// export EnqueueFaceAnimationIsError;


// export function EnqueueFaceAnimationIsSuccess(response: EnqueueFaceAnimationResponse): response is EnqueueFaceAnimationSuccessResponse {
//   return response?.success === true;
// }

// export function EnqueueFaceAnimationIsError(response: EnqueueFaceAnimationResponse): response is EnqueueFaceAnimationErrorResponse {
//   return response?.success === false;
// }

export async function EnqueueFaceAnimation(request: EnqueueFaceAnimationRequest) : Promise<EnqueueFaceAnimationResponse> 
{
  const endpoint = new ApiConfig().enqueueFaceAnimation();
  
  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  })
  .then(res => res.json())
  .then(res => {
    if (!res) {
      return { success : false };
    }

    if (res && 'success' in res) {
      return res;
    } else {
      return { success : false };
    }
  })
  .catch(e => {
    return { success : false };
  });
}
