import { twMerge } from "tailwind-merge";
import { Activity } from "~/components/ui/Activity/Activity";
// import { paperWrapperStyles } from "~/components/styles";
// import { faPlus, faQuestion } from "@fortawesome/pro-solid-svg-icons";
// import { ToolbarButton } from "~/components/features/ToolbarButton";

export const ToolbarTopRight = () => {
  return (
    <div
      className={twMerge("relative z-50 flex h-fit w-fit items-center gap-2")}
    >
      <Activity />
    </div>
  );
};
