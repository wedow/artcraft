import { ButtonHTMLAttributes, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/pro-solid-svg-icons";

import { Tooltip } from "~/components/ui";

export interface ToolbarButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  hidden?: boolean;
  prominent?: boolean;
}

export const ToolbarButton = ({
  children,
  icon,
  tooltip,
  onClick,
  buttonProps = {},
  iconProps,
}: {
  children?: React.ReactNode;
  icon: IconDefinition;
  tooltip?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  buttonProps?: ToolbarButtonProps;
  iconProps?: Omit<FontAwesomeIconProps, "icon">;
}) => {
  const {
    className: customButtonClassNames,
    disabled,
    active,
    hidden,
    onClick: customOnClick,
    ...restButtonProps
  } = buttonProps;

  if (hidden) {
    return null;
  }

  const mergedButtonClasses = twMerge(
    "rounded-lg hover:bg-white/15 transition-all duration-100 border-2 border-transparent text-white/80 px-2",
    children ? "w-fit flex items-center gap-2.5 text-nowrap" : "size-10",
    active && "bg-primary/30 border-2 border-primary hover:bg-primary/30",
    disabled && "pointer-events-none text-secondary-300",
    buttonProps.prominent &&
      "border border-primary-400/30 text-primary-500 hover:bg-primary-100/40 hover:border-primary-400/60",
    customButtonClassNames,
  );

  const Button = (
    <button
      className={mergedButtonClasses}
      disabled={disabled}
      autoFocus={false}
      tabIndex={-1}
      style={{
        outline: "none",
        boxShadow: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      {...restButtonProps}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
          onClick(e);
        } else if (customOnClick) {
          customOnClick(e);
        }
      }}
    >
      <FontAwesomeIcon icon={icon} {...iconProps} />
      {children}
    </button>
  );
  if (tooltip) {
    return (
      <Tooltip position="right" tip={tooltip}>
        {Button}
      </Tooltip>
    );
  }
  return Button;
};
