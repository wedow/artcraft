import { twMerge } from "tailwind-merge";
import { TabSelector, TabItem } from "~/components/ui/TabSelector";
import { useComputed } from "@preact/signals-react";
import {
  appMode,
  dispatchUiEvents,
  GenerationLoadingState,
  generationSignal,
} from "~/signals";
import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "~/components/ui/Button";

// import { paperWrapperStyles } from "~/components/styles";
// import { faPlus, faQuestion } from "@fortawesome/pro-solid-svg-icons";
// import { ToolbarButton } from "~/components/features/ToolbarButton";

export const ToolbarTopLeft = () => {
  // Use the appMode signal directly with useComputed for reactivity - active tab sets the app mode
  const activeTab = useComputed(() => appMode.value);

  const tabs: TabItem[] = [
    { id: "realtime", label: "Sketch" },
    { id: "gallery", label: "Gallery" },
    //{ id: "generate", label: "Generate" },
    // { id: "video", label: "Video" },
  ];

  const handleTabChange = (tabId: string) => {
    // Update the global signal
    dispatchUiEvents.changeAppMode(
      tabId as "realtime" | "edit" | "generate" | "gallery",
    );
  };

  const generationState = generationSignal.value;

  const handleClick = () => {
    window.location.href = "https://storyteller-3d.netlify.app/";
  };

  console.log(appMode.value);

  return (
    <div
      className={twMerge(
        "relative z-50 flex h-fit w-fit items-center gap-8 pl-1 pr-4",
      )}
    >
      <img
        src="/brand/artcraft-logo.png"
        alt="logo"
        className="h-[28px] select-none"
      />

      {/* <Button
        variant="secondary"
        icon={faChevronRight}
        iconClassName="text-xs"
        iconFlip={true}
        onClick={handleClick}
        className="bg-transparent p-0 text-sm text-white/80 hover:bg-transparent hover:text-white hover:underline hover:underline-offset-2"
      >
        Go to 3D Stage Editor
      </Button> */}

      {/* <TabSelector
        tabs={tabs}
        activeTab={activeTab.value}
        onTabChange={handleTabChange}
        disabled={
          generationState.loadingState === GenerationLoadingState.GENERATING
        }
      /> */}

      {/* <ToolbarButton icon={faPlus}>
        <span className="font-semibold">New Board</span>
      </ToolbarButton>
      <ToolbarButton icon={faQuestion}>
        <span className="font-semibold">Help</span>
      </ToolbarButton> */}
    </div>
  );
};
