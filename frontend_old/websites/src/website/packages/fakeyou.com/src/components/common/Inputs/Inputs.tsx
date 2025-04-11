import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "./Inputs.scss";
import {
  default as ReactSelect,
  Props as ReactSelectProps,
} from "react-select";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: IconDefinition;
  label?: string;
  textArea?: boolean;
}

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  textArea?: boolean;
}

interface SelectProps extends ReactSelectProps {
  icon?: IconDefinition;
  label?: string;
  rounded?: boolean;
}

export function Input({ label, icon, textArea, ...rest }: InputProps) {
  return (
    <div>
      {label && <label className="sub-title">{label}</label>}

      <div className={`form-group ${icon ? "input-icon" : ""}`}>
        {icon && (
          <FontAwesomeIcon icon={icon} className="form-control-feedback" />
        )}
        <input className="form-control" {...rest} />
      </div>
    </div>
  );
}

export function TextArea({ label, textArea, ...rest }: TextAreaProps) {
  return (
    <div>
      {label && <label className="sub-title">{label}</label>}

      <div className="form-group">
        <textarea className="form-control" {...rest} />
      </div>
    </div>
  );
}

export function Select({ label, icon, rounded, ...rest }: SelectProps) {
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

      <div className={`form-group ${icon ? "input-icon" : ""}`}>
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
