import { twMerge } from "tailwind-merge";

// import { paperWrapperStyles } from "~/components/styles";
// import { faPlus, faQuestion } from "@fortawesome/pro-solid-svg-icons";
// import { ToolbarButton } from "~/components/features/ToolbarButton";

export const ToolbarTopLeft = () => {
  return (
    <div className={twMerge("z-20 flex h-fit w-fit items-center gap-1")}>
      <img
        src="/brand/mira-logo.png"
        alt="logo"
        className="h-[30px] select-none pb-1"
      />
      {/* <ToolbarButton icon={faPlus}>
        <span className="font-semibold">New Board</span>
      </ToolbarButton>
      <ToolbarButton icon={faQuestion}>
        <span className="font-semibold">Help</span>
      </ToolbarButton> */}
    </div>
  );
};
