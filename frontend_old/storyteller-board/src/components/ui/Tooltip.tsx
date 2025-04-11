import { cloneElement, ReactElement, JSXElementConstructor } from "react";
import { twMerge } from "tailwind-merge";

import { toolTipStyles } from "~/components/styles";

export const Tooltip = ({
  tip,
  children,
  forceShow,
}: {
  tip: string;
  children: ReactElement<any, string | JSXElementConstructor<any>>;
  forceShow?: boolean;
}) => {
  const clonedChildren = cloneElement(children, {
    "data-tooltip": tip,
    className: twMerge(
      toolTipStyles,
      forceShow && "after:block before:block",
      children.props.className,
    ),
  });
  return clonedChildren;
};
