import React from "react";

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
  labelClassName?: string;
  size?: number;
  padding?: boolean;
  thin?: boolean;
}

export default function LoadingSpinner({
  className,
  label,
  labelClassName,
  size = 36,
  padding = true,
  thin = false,
}: LoadingSpinnerProps) {
  return (
    <div
      className={`d-flex justify-content-center align-items-center overflow-hidden gap-3 ${
        className ? className : ""
      } ${padding ? "pt-2" : ""}`.trim()}
    >
      <div
        className="spinner-border"
        role="status"
        style={{ height: size, width: size, borderWidth: thin ? 2 : "0.25em" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {label && (
        <div className={`fw-medium ${labelClassName}`.trim()}>{label}</div>
      )}
    </div>
  );
}
