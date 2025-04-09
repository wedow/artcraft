import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: IconDefinition;
  label?: string;
  // textArea?: boolean;
  className?: string;
}

export default function Input({
  label,
  icon,
  // textArea,
  className,
  ...rest
}: InputProps) {
  return (
    <div className={className}>
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
