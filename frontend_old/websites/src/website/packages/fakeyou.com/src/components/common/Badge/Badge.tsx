import React from "react";
import "./Badge.scss";
import { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface BadgeProps {
  className?: string;
  color?: string;
  label?: string;
  icon?: IconDefinition;
  overlay?: boolean;
  small?: boolean;
  to?: string;
}

export default function Badge({
  className = "",
  color = "gray",
  icon,
  label,
  overlay = false,
  small = false,
  to,
}: BadgeProps) {
  const badgeClass = `fy-badge badge-${color} ${
    overlay ? "shadow" : ""
  } mb-0 ${className} ${small ? "badge-small" : ""} ${
    label ? "" : "icon-badge"
  }`.trim();

  const ElementType = to ? "a" : "div";

  return (
    <ElementType
      {...{
        ...(to
          ? {
              download: true,
              href: to,
              onClick: (e: any) => e.stopPropagation(),

              target: "_blank",
            }
          : {}),
      }}
      className={badgeClass}
    >
      {icon && (
        <FontAwesomeIcon
          {...{
            className: label ? "me-1" : "",
            icon,
          }}
        />
      )}
      {label && label}
    </ElementType>
  );
}
