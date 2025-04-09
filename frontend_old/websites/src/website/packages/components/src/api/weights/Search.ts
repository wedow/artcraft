import { LanguageTag } from "../Languages";
import MakeRequest from "../MakeRequest";
import { WeightCategory, WeightType } from "../_common/enums";
import { Weight } from "./GetWeight";

export interface SearchWeightRequest {}

export interface SearchWeightResponse {
  success: boolean;
  weights?: Weight[];
}

export interface SearchWeightParams {
  search_term: string;
  weight_type?: WeightType;
  weight_category?: WeightCategory;
  ietf_language_subtag?: LanguageTag;
  sort_direction?: string;
  sort_field?: string;
}

export const SearchWeight = MakeRequest<
  string,
  SearchWeightRequest,
  SearchWeightResponse,
  SearchWeightParams
>({
  method: "GET",
  routingFunction: () => `/v1/weights/search`,
});
