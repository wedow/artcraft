import { cloneElement, ReactElement, JSXElementConstructor } from "react";
import { twMerge } from "tailwind-merge";

import { toolTipStyles } from "../../components/styles";

export const Tooltip = ({
  tip,
  children,
  forceShow,
  position = "top",
}: {
  tip: string;
  children: ReactElement<any, string | JSXElementConstructor<any>>;
  forceShow?: boolean;
  position?: "top" | "bottom" | "left" | "right";
}) => {
  const clonedChildren = cloneElement(children, {
    "data-tooltip": tip,
    className: twMerge(
      toolTipStyles.base,
      toolTipStyles[position],
      forceShow && "after:block before:block",
      children.props.className,
    ),
  });
  return clonedChildren;
};
