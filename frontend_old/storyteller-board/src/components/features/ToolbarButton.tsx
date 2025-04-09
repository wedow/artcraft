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
    "rounded-lg py-2 px-3 hover:bg-gray-200/50 transition-all duration-100",
    children ? "w-fit flex items-center gap-2 text-nowrap" : "size-10",
    active && "pointer-events-none text-primary ",
    disabled && "pointer-events-none text-secondary-300",
    buttonProps.prominent &&
      "highlight-button border border-primary-400/30 text-primary-500 hover:bg-primary-100/40 hover:border-primary-400/60",
    customButtonClassNames,
  );

  const Button = (
    <button
      className={mergedButtonClasses}
      disabled={disabled}
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
    return <Tooltip tip={tooltip}>{Button}</Tooltip>;
  }
  return Button;
};
