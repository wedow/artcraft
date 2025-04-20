import { TtsState, V2VState } from "../../../../models/voice";

export const initialTtsState: TtsState = {
  voice: undefined,
  text: "",
};

export const initialV2VState: V2VState = {
  voice: undefined,
  file: undefined,
  inputFileToken: undefined,
};
