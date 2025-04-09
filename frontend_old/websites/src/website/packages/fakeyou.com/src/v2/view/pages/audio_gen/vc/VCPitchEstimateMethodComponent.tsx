import React from "react";
import Select from "react-select";
import { EnqueueVoiceConversionFrequencyMethod } from "@storyteller/components/src/api/voice_conversion/EnqueueVoiceConversion";

interface PitchShiftProps {
  pitchMethod?: EnqueueVoiceConversionFrequencyMethod;
  onMethodChange: (newMethod?: EnqueueVoiceConversionFrequencyMethod) => void;
}

const dropdownFieldClass = {
  control: (state: any) =>
    state.isFocused
      ? "select-search no-padding focused rounded"
      : "select-search no-padding rounded",
  option: (state: any) => (state.isFocused ? "select-option" : "select-option"),
  input: (state: any) => (state.isFocused ? "select-input" : "select-input"),
  placeholder: (state: any) =>
    state.isFocused ? "select-placeholder" : "select-placeholder",
  singleValue: (state: any) =>
    state.isFocused ? "select-value" : "select-value",
  menu: (state: any) =>
    state.isFocused ? "select-container" : "select-container",
  indicatorSeparator: (state: any) =>
    state.isFocused ? "select-separator" : "select-separator",
};

export default function VCPitchEstimateMethodComponent(props: PitchShiftProps) {
  const handleMethodChange = (option: any, actionMeta: any) => {
    const pitchMethodName = option?.value;
    let pitchMethod = undefined;

    switch (pitchMethodName) {
      case "rmvpe":
        pitchMethod = EnqueueVoiceConversionFrequencyMethod.Rmvpe;
        break;
      case "crepe":
        pitchMethod = EnqueueVoiceConversionFrequencyMethod.Crepe;
        break;
      case "harvest":
        pitchMethod = EnqueueVoiceConversionFrequencyMethod.Harvest;
        break;
      case "dio":
        pitchMethod = EnqueueVoiceConversionFrequencyMethod.Dio;
        break;
    }

    props.onMethodChange(pitchMethod);
  };

  interface DropdownOption {
    label: string;
    value: EnqueueVoiceConversionFrequencyMethod;
  }

  const options: DropdownOption[] = [
    {
      label: "RMVPE (typically best overall)",
      value: EnqueueVoiceConversionFrequencyMethod.Rmvpe,
    },
    {
      label: "CREPE (good for noisy samples)",
      value: EnqueueVoiceConversionFrequencyMethod.Crepe,
    },
    { label: "Harvest", value: EnqueueVoiceConversionFrequencyMethod.Harvest },
    // NB: We no longer recommend DIO.
    //{ label: "DIO", value: EnqueueVoiceConversionFrequencyMethod.Dio },
  ];

  const selectedOption =
    options.find(option => option.value === props.pitchMethod) || options[0];

  return (
    <>
      <div>
        <Select
          value={selectedOption} // Controlled components use "value" instead of "defaultValue".
          options={options}
          classNames={dropdownFieldClass}
          //placeholder={options[0]}
          isSearchable={false}
          onChange={handleMethodChange}
        />
      </div>
    </>
  );
}
