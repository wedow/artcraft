import React from "react";
import "./TextArea.scss";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  textArea?: boolean;
  required?: boolean;
  resize?: boolean;
  className?: string;
}

export default function TextArea({
  label,
  textArea,
  required,
  resize = true,
  className,
  ...rest
}: TextAreaProps) {
  return (
    <div className="fy-textarea flex-grow-1 position-relative">
      {label && (
        <label className={`sub-title ${required ? "required" : ""}`.trim()}>
          {label}
        </label>
      )}
      <textarea
        className={`form-control ${
          resize ? "" : "no-resize"
        } ${className}`.trim()}
        {...rest}
      />
    </div>
  );
}
