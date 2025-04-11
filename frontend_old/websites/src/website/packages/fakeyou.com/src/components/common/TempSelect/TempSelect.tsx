import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import ReactSelect, { Props as ReactSelectProps } from "react-select";
import "./TempSelect.scss";

type OptionValue = string | number | boolean;

export interface BaseOption {
  value?: OptionValue;
  label: string;
}

export interface Option extends BaseOption {
  options?: BaseOption[];
}

export interface SelectProps extends ReactSelectProps {
  icon?: IconDefinition;
  label?: string;
  rounded?: boolean;
  small?: boolean;
  options: Option[];
  onChange?: (value: any) => void;
  required?: boolean;
  className?: string;
}

export default function Select({
  label,
  icon,
  name,
  onChange: inChange = () => {},
  options = [],
  rounded,
  small,
  value,
  required,
  ...rest
}: SelectProps) {
  const isMulti = Array.isArray(value);
  const findVal = (opts: Option[], nest = 0): Option | undefined => {
    let val: Option | undefined;
    opts.forEach(option => {
      if (!val) {
        if (option.options) {
          val = findVal(option.options, ++nest);
        } else if (option.value === value) {
          val = option;
        }
      }
    });
    return val;
  };

  const valueLabel = findVal(options)?.label || "";
  const onChange = (option: any, x: any) => {
    if (Array.isArray(option)) {
      inChange({
        target: {
          value: option.map(({ value = "" }) => value),
          name,
          type: "select",
        },
      });
    } else {
      inChange({ target: { value: option.value, name, type: "select" } });
    }
  };
  const className = `${icon ? " input-icon" : ""}${
    small ? " select-small" : ""
  }`;
  const classNames = {
    control: ({ isFocused }: { isFocused: boolean }) =>
      `select${icon ? " with-icon" : ""}${rounded ? " rounded-full" : ""}${
        isFocused ? " focused" : ""
      }`,
    option: () => "select-option",
    input: () => "select-input",
    placeholder: () => "select-placeholder",
    singleValue: () => "select-value",
    menu: () => "select-container",
    indicatorSeparator: () => "select-separator",
  };

  return (
    // Changed fragment to div here just so that it can be laid out with bootstrap easily using d-flex, flex-column and responsive gaps which requires grouping.
    <div className="fy-temp-select">
      {label && (
        <label className={`sub-title ${required ? "required" : ""}`}>
          {label}
        </label>
      )}
      <div {...{ className }}>
        {icon && (
          <FontAwesomeIcon icon={icon} className="form-control-feedback" />
        )}
        <div className="w-100">
          <ReactSelect
            {...{
              classNamePrefix: "select",
              classNames,
              isMulti,
              name,
              onChange,
              options,
              ...(value &&
                (isMulti
                  ? {
                      value: Array.isArray(value)
                        ? value.map((val: any) => ({ label: val, value: val }))
                        : [],
                    }
                  : { value: { label: valueLabel, value } })),
              ...rest,
            }}
          />
        </div>
      </div>
    </div>
  );
}
