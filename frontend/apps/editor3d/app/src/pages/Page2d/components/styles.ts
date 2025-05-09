import { twMerge } from "tailwind-merge";

export const paperWrapperStyles =
  "rounded-xl border border-ui-panel-border p-1.5 shadow-lg bg-ui-background";

export const transitionTimingStyles = "transition duration-150 ease-in-out";

export const toolTipStyles = {
  base: twMerge(
    "relative",
    "after:absolute after:z-40",
    "after:content-[attr(data-tooltip)] after:text-black after:text-nowrap after:text-sm after:font-medium after:text-white/80 after:glass",
    "after:rounded-lg after:border after:border-ui-border after:bg-ui-panel after:px-2.5 after:py-1 after:shadow-xl",
    "after:hidden hover:after:block",
  ),
  top: twMerge(
    "after:left-1/2 after:bottom-full after:-translate-x-1/2 after:mb-3.5",
  ),
  bottom: twMerge(
    "after:left-1/2 after:top-full after:-translate-x-1/2 after:mt-3.5",
  ),
  left: twMerge(
    "after:top-1/2 after:right-full after:-translate-y-1/2 after:mr-3.5",
  ),
  right: twMerge(
    "after:top-1/2 after:left-full after:-translate-y-1/2 after:ml-3.5",
  ),
};

export const dialogPanelStyles = twMerge(
  "flex max-w-5xl flex-col justify-between gap-4 p-6 bg-[#1C1C20]",
);
