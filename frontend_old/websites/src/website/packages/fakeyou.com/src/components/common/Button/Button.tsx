import React from "react";
import { Link } from "react-router-dom";
import "./Button.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ButtonProps from "./ButtonProps";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

export default function Button({
  buttonRef,
  label,
  icon,
  onClick,
  small,
  variant: variantProps = "primary",
  to,
  href,
  target = "_self",
  square,
  tooltip,
  full = false,
  iconFlip = false,
  download,
  disabled,
  isLoading = false,
  isActive,
  type = "button",
  fontLarge,
  iconClassName,
  focusPoint,
  ...rest
}: ButtonProps) {
  let variant = variantProps;
  if (isActive !== undefined) {
    if (isActive) {
      variant = "primary";
    } else variant = "secondary";
  }
  if (variant === "action") {
    variant = "action";
  }
  if (variant === "danger") {
    variant = "danger";
  }
  if (variant === "discord") {
    variant = "discord";
  }
  if (variant === "rainbow") {
    variant = "rainbow";
  }
  let iconMarginClass = !square && label ? (iconFlip ? "ms-2" : "me-2") : "";
  let IconComponent = icon ? (
    <FontAwesomeIcon
      icon={icon}
      className={`${iconMarginClass} ${iconClassName}`.trim()}
    />
  ) : null;

  let LabelComponent = !square ? label : null;

  const SpinnerComponent = isLoading ? (
    <div
      className={`spinner-border spinner-border-sm text-white ${
        square ? "" : "ms-2"
      }`.trim()}
      role="status"
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  ) : null;

  const externalClass = rest.className || "";

  const commonProps = {
    className: `${externalClass} button ${small ? "button-small" : ""} ${
      fontLarge ? "button-font-large" : ""
    } ${
      square ? (small ? "button-square-small" : "button-square") : ""
    } button-${variant} ${full ? "w-100" : ""}`,
    disabled: disabled || isLoading,
    onClick,
  };

  delete rest.className;

  const ButtonContent = iconFlip ? (
    <>
      {focusPoint ? <div className="focus-point" /> : null}
      {LabelComponent}
      {IconComponent}
      {SpinnerComponent}
    </>
  ) : (
    <>
      {focusPoint ? <div className="focus-point" /> : null}
      {isLoading ? null : IconComponent}
      {LabelComponent}
      {SpinnerComponent}
    </>
  );

  const WrappedButton = to ? (
    <Link {...{ ...commonProps, to }}>{ButtonContent}</Link>
  ) : href ? (
    <a
      rel="noopener noreferrer"
      download={
        download ? (typeof download === "string" ? download : true) : undefined
      }
      {...{ ...commonProps, href, target }}
    >
      {ButtonContent}
    </a>
  ) : (
    <button {...{ ...commonProps, ...rest, type: type, ref: buttonRef }}>
      {ButtonContent}
    </button>
  );

  return tooltip ? (
    <Tippy theme="fakeyou" content={tooltip}>
      {WrappedButton}
    </Tippy>
  ) : (
    WrappedButton
  );
}
