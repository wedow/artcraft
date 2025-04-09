import React from "react";
import "./Label.scss";

interface Props {
  invalidReason?: string;
  label?: any;
  required?: boolean;
  disabled?: boolean;
}

export default function Label({
  invalidReason,
  label,
  required,
  disabled,
}: Props) {
  return label ? (
    <div {...{ className: `fy-input-label${disabled ? "opacity-50" : ""}` }}>
      <label {...{ className: `fw-medium${required ? " required" : ""}` }}>
        {label}
      </label>
      {invalidReason ? (
        <span {...{ className: "label-error form-text red is-danger" }}>
          {invalidReason}
        </span>
      ) : null}
    </div>
  ) : null;
}
