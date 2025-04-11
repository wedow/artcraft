import MakeRequest from "../MakeRequest";
import { EngineCategory } from "@storyteller/components/src/api/_common/enums/EngineCategory";

export interface EditEngineCategoryRequest {
  engine_category: EngineCategory;
}

export interface EditEngineCategoryResponse {
  success: boolean;
}

export const EditEngineCategory = MakeRequest<
  string,
  EditEngineCategoryRequest,
  EditEngineCategoryResponse,
  {}
>({
  method: "POST",
  routingFunction: (mediaFielToken: string) =>
    `/v1/media_files/engine_category/${mediaFielToken} `,
});
