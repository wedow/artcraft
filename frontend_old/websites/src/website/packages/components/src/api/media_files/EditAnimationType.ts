import MakeRequest from "../MakeRequest";
import { AnimationType } from "@storyteller/components/src/api/_common/enums/AnimationType";

export interface EditAnimationTypeRequest {
  maybe_animation_type: AnimationType;
}

export interface EditAnimationTypeResponse {
  success: boolean;
}

export const EditAnimationType = MakeRequest<
  string,
  EditAnimationTypeRequest,
  EditAnimationTypeResponse,
  {}
>({
  method: "POST",
  routingFunction: (mediaFielToken: string) =>
    `/v1/media_files/animation_type/${mediaFielToken} `,
});
