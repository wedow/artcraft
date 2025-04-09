import { useState } from "react";
import {
  InputValidation,
  InputStateLibrary,
  ValidatorCallbacks,
} from "common/InputValidation";

interface InputInput {
  errorText?: { [key: string]: string };
  validator?: (value: ValidatorCallbacks) => ValidatorOutput;
  value: any;
}

interface Props {
  [key: string]: InputInput;
}

interface ValidatorOutput {
  additional?: any;
  value: any;
  reason: string;
  validation: any;
}

const noValidation = ({ inputValue }: ValidatorCallbacks) => ({
  value: inputValue,
  reason: "",
  validation: InputValidation.Neutral,
});

export default function useChanger(input: Props) {
  const baseValidation = Object.keys(input).reduce(
    (obj, key) => ({
      ...obj,
      [key]: {
        reason: "",
        validation: InputValidation.Neutral,
        value: input[key].value,
      },
    }),
    {}
  );
  const [state, stateSet] = useState<InputStateLibrary>(baseValidation);

  const changer =
    (name: string) =>
    ({ target }: { target: { value: any } }) => {
      const validator = input[name]?.validator || noValidation;
      const { additional, value, reason, validation }: ValidatorOutput =
        validator({ inputValue: target.value, name, state });
      const updateValidations = (initial: InputStateLibrary) => ({
        ...initial,
        ...additional,
        [name]: { reason, validation, value },
      });

      stateSet(updateValidations);
      // setter(newValue);
    };

  const allAreValid = () =>
    !Object.values(state).find(
      (item, i) =>
        item.validation === InputValidation.Neutral ||
        item.validation === InputValidation.Invalid
    );

  const setProps = (name: string) => {
    const config = input[name];
    const current = state[name];
    if (config && current) {
      return {
        name,
        value: current.value,
        invalidReason: config.errorText ? config.errorText[current.reason] : "",
        onChange: changer(name),
      };
    }
  };

  const update = ({
    name,
    reason,
    validation,
  }: {
    name: string;
    reason: string;
    validation: number;
  }) =>
    stateSet((lib: InputStateLibrary) => ({
      ...lib,
      [name]: { ...state[name], reason, validation },
    }));

  return { allAreValid, setProps, state, update };
}
