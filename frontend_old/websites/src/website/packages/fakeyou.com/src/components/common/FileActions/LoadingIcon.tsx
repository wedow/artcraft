import React from "react";

export default function LoadingIcon() {
  return <>
    <span
      className="spinner-border spinner-border-sm ms-3"
      role="status"
      aria-hidden="true"
    ></span>
    <span className="visually-hidden">Loading...</span>
  </>;
};