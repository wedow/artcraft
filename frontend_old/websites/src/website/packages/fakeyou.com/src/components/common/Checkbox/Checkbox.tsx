import React from "react";
import { Check } from "components/svg";
import { useId } from "hooks";
import makeClass from "resources/makeClass";
import "./Checkbox.scss";

interface Props {
  checked?: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
  name?: string;
  onChange?: any;
  variant?: "primary" | "secondary";
}

export default function Checkbox({
  checked,
  className = "",
  disabled,
  label = "",
  name = "",
  onChange,
  variant = "secondary",
}: Props) {
  const onClick = ({ target }: any) =>
    !disabled
      ? onChange({ target: { checked: !checked, name, type: "checkbox" } })
      : {};
  const id = "checkbox-" + useId();
  return (
    <div
      {...{
        ...makeClass(
          `fy-checkbox-frame fy-checkbox-${variant}-${
            checked ? "checked" : "unchecked"
          } ${disabled ? "fy-checkbox-disabled" : ""}`,
          className
        ),
      }}
    >
      <svg {...{ className: `fy-checkbox`, onClick }}>
        <Check {...{ checked }} />
      </svg>
      {label && (
        <label
          {...{
            className: "form-check-label fw-medium",
            htmlFor: id,
            onClick,
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
}
