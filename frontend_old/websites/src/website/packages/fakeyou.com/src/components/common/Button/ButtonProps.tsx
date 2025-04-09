import { ButtonHTMLAttributes } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export default interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonRef?: any;
  label?: string | null;
  onClick?: (e: any) => any;
  icon?: IconDefinition;
  small?: boolean;
  variant?: string;
  // variant?: "primary" | "secondary" | "danger" | "link"; // this behaves weirdly
  to?: string;
  href?: string;
  target?: "_blank" | "_self";
  square?: boolean;
  tooltip?: string;
  full?: boolean;
  iconFlip?: boolean;
  download?: boolean | string;
  disabled?: boolean;
  isLoading?: boolean;
  isActive?: boolean;
  fontLarge?: boolean;
  iconClassName?: string;
  focusPoint?: boolean;
}
