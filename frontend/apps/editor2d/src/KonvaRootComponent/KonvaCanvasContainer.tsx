import { forwardRef, HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

import { useRenderCounter } from "~/hooks/useRenderCounter";

export const KonvaCanvasContainer = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  useRenderCounter("KonvaCanvasContainer");

  const classes = twMerge("pegboard -z-10", className);
  return <div ref={ref} className={classes} {...props} />;
});
