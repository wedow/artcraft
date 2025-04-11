export enum InputValidation {
  Neutral,
  Invalid,
  Valid,
}


export interface InputState {
  validation: InputValidation,
  value: any,
  reason: string
}

export interface InputStateLibrary {
  [key: string]: InputState
}

export interface ValidatorCallbacks {
  state: InputStateLibrary,
  inputValue: any,
  name: string,
}