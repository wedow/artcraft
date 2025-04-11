import { ApiConfig } from "../ApiConfig";
import { Weight } from "./GetWeight";

export interface SearchWeightsRequest {
  search_term: string;
  weight_type?: string;
  weight_category?: string;
  ietf_language_tag?: string;
}

export interface SearchWeightsResponse {
  success: boolean;
  weights: Weight[];
}

export enum SearchWeightsError {
  NotFound,
  ServerError,
  FrontendError,
}

export async function SearchWeights(
  request: SearchWeightsRequest
): Promise<SearchWeightsResponse> {
  const endpoint = new ApiConfig().searchWeights();

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
