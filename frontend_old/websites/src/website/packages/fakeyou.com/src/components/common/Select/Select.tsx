import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "./Select.scss";
import {
  default as ReactSelect,
  Props as ReactSelectProps,
} from "react-select";

interface SelectProps extends ReactSelectProps {
  icon?: IconDefinition;
  label?: string;
  rounded?: boolean;
  small?: boolean;
  onChange?: (value: any) => void;
}

export default function Select({
  label,
  icon,
  rounded,
  small,
  ...rest
}: SelectProps) {
  const SelectFieldClass = {
    control: (state: any) =>
      state.isFocused
        ? `select focused ${icon && "with-icon"} ${rounded && "rounded-full"}`
        : `select ${icon && "with-icon"} ${rounded && "rounded-full"}`,
    option: (state: any) =>
      state.isFocused ? "select-option" : "select-option",
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

  return (
    <div>
      {label && <label className="sub-title">{label}</label>}

      <div
        className={`form-group ${icon ? "input-icon" : ""} ${
          small && "select-small"
        }`}
      >
        {icon && (
          <FontAwesomeIcon icon={icon} className="form-control-feedback" />
        )}
        <div className="w-100">
          <ReactSelect
            classNamePrefix="select"
            classNames={SelectFieldClass}
            {...rest}
          />
        </div>
      </div>
    </div>
  );
}
