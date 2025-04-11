import { ApiConfig } from "@storyteller/components";

interface W2lTemplateUseCountResponsePayload {
  success: boolean,
  count: number | null | undefined,
}

export async function GetW2lTemplateUseCount(templateToken: string) : Promise<number | undefined> {
  const endpoint = new ApiConfig().getW2lTemplateUseCount(templateToken);

  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : W2lTemplateUseCountResponsePayload = res;
    if (!response.success) {
      return;
    }
    return response.count || 0;
  })
  .catch(e => {
    return undefined;
  });
}
