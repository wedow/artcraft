import { ApiConfig } from "@storyteller/components";

interface TtsModelUseCountResponsePayload {
  success: boolean,
  count: number | null | undefined,
}

export async function GetTtsModelUseCount(modelToken: string) : Promise<number | undefined> {
  const endpoint = new ApiConfig().getTtsModelUseCount(modelToken);

  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : TtsModelUseCountResponsePayload = res;
    if (!response.success) {
      return;
    }
    return response.count || 0;
  })
  .catch(e => {
    return undefined;
  });
}
