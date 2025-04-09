import { twMerge } from "tailwind-merge";

export const paperWrapperStyles =
  "rounded-xl border border-ui-border bg-ui-panel p-2 shadow-lg";

export const transitionTimingStyles = "transition duration-150 ease-in-out";

export const dialogBackgroundStyles =
  "fixed inset-0 flex w-screen items-center justify-center bg-black/50";

export const toolTipStyles = twMerge(
  "relative",
  "before:w-0 before:h-0 before:absolute",
  "before:left-1/2 before:bottom-full before:mb-[1px] before:-translate-x-1/2 before:z-50",
  "before:border-l-8 before:border-l-transparent",
  "before:border-r-8 before:border-r-transparent",
  "before:border-t-8 before:border-t-white",
  "after:absolute after:left-1/2 after:bottom-full after:-translate-x-1/2 after:z-40",
  "after:content-[attr(data-tooltip)] after:text-black after:text-nowrap",
  "after:rounded-lg after:border after:border-ui-border after:bg-ui-panel after:px-2.5 after:py-1.5 after:mb-2 after:shadow-xl",
  "after:hidden before:hidden hover:after:block hover:before:block",
);

export const dialogPanelStyles = twMerge(
  "flex max-w-5xl flex-col justify-between gap-4 p-6",
);
