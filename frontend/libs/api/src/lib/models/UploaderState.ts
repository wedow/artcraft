import { UploaderStates } from "../enums/UploaderStates";

export interface UploaderState {
  status: UploaderStates;
  errorMessage?: string;
  data?: string;
}

export const initialUploaderState = {
  status: UploaderStates.ready,
};
