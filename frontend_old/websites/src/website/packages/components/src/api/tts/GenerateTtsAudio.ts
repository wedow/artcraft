import { ApiConfig } from "../ApiConfig";


export interface GenerateTtsAudioRequest {
  uuid_idempotency_token: string,
  tts_model_token: string,
  inference_text: string,
  // TODO(2022-03): TEMPORARY
  is_storyteller_demo?: boolean,
}

export interface GenerateTtsAudioSuccess {
  success: boolean,
  inference_job_token: string,
  // Which queue to poll
  inference_job_token_type?: string,
}

export interface GenerateTtsAudioError {
  error: GenerateTtsAudioErrorType,
}

export enum GenerateTtsAudioErrorType {
  BadRequest,
  NotFound,
  TooManyRequests,
  ServerError,
  UnknownError,
}

export type GenerateTtsAudioResponse = GenerateTtsAudioSuccess | GenerateTtsAudioError; 

export function GenerateTtsAudioIsOk(response: GenerateTtsAudioResponse): response is GenerateTtsAudioSuccess {
  return ('inference_job_token' in response);
}

export function GenerateTtsAudioIsError(response: GenerateTtsAudioResponse): response is GenerateTtsAudioError {
  return !('inference_job_token' in response);
}

export async function GenerateTtsAudio(request: GenerateTtsAudioRequest) : Promise<GenerateTtsAudioResponse> 
{
  const endpoint = new ApiConfig().inferTts();
  
  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  })
  .then(res =>  res.json().then(data => ({ status: <number>res.status, body: <EndpointResponse>data })))
  .then((fullResponse) => {
    let maybeError = maybeMapError(fullResponse);
    if (maybeError !== undefined) {
      return { error: maybeError };
    }
    if (!fullResponse.body || !fullResponse.body.success) {
      return { error: GenerateTtsAudioErrorType.UnknownError };
    }

    if (!('inference_job_token' in fullResponse.body)) {
      return { error: GenerateTtsAudioErrorType.UnknownError };
    } else {
      return <GenerateTtsAudioSuccess> {
        inference_job_token: fullResponse.body.inference_job_token,
        inference_job_token_type: fullResponse.body.inference_job_token_type,
      };
    }
  }) 
  .catch(e => {
    let maybeError = maybeMapError(e);
    if (maybeError !== undefined) {
      return { error: maybeError };
    }
    return { error: GenerateTtsAudioErrorType.UnknownError };
  });
}

interface StatusLike {
  status: number,
}

function maybeMapError(statuslike: StatusLike) : GenerateTtsAudioErrorType | undefined {
  switch (statuslike.status) {
    case 400:
      return GenerateTtsAudioErrorType.BadRequest;
    case 404:
      return GenerateTtsAudioErrorType.NotFound;
    case 429:
      return GenerateTtsAudioErrorType.TooManyRequests;
    case 500:
      return GenerateTtsAudioErrorType.ServerError;
  }
}

interface EndpointSuccessResponse {
  success: boolean,
  inference_job_token: string,
  inference_job_token_type?: string,
}

interface EndpointErrorResponse {
  success: boolean,
}

type EndpointResponse = EndpointSuccessResponse | EndpointErrorResponse;
