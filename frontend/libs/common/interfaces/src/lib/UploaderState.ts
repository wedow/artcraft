import { UploaderStates } from "@storyteller/enums";

export interface UploaderState {
  status: UploaderStates;
  errorMessage?: string;
  data?: string;
}
