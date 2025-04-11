import { ApiConfig } from "@storyteller/components";

export interface EnqueueVideoMotionCaptureRequest {
  uuid_idempotency_token: string,
  video_source: string,
}

export interface EnqueueVideoMotionCaptureResponse {
  success: boolean,
  inference_job_token?: string,
}

export async function EnqueueVideoMotionCapture(request: EnqueueVideoMotionCaptureRequest) : Promise<EnqueueVideoMotionCaptureResponse> 
{
  const endpoint = new ApiConfig().enqueueVideoMotionCapture();
  
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

