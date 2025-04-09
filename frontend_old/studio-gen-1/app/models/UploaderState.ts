import { UploaderStates } from "~/enums";

export interface UploaderState {
  status: UploaderStates;
  errorMessage?: string;
}

export const initialUploaderState = {
  status: UploaderStates.ready,
};
