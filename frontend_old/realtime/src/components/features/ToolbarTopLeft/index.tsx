import { twMerge } from "tailwind-merge";
import { TabSelector, TabItem } from "~/components/ui/TabSelector";
import { useComputed } from "@preact/signals-react";
import {
  appMode,
  dispatchUiEvents,
  GenerationLoadingState,
  generationSignal,
} from "~/signals";

// import { paperWrapperStyles } from "~/components/styles";
// import { faPlus, faQuestion } from "@fortawesome/pro-solid-svg-icons";
// import { ToolbarButton } from "~/components/features/ToolbarButton";

export const ToolbarTopLeft = () => {
  // Use the appMode signal directly with useComputed for reactivity - active tab sets the app mode
  const activeTab = useComputed(() => appMode.value);

  const tabs: TabItem[] = [
    { id: "realtime", label: "Sketch" },
    { id: "edit", label: "Edit" },
    { id: "generate", label: "Generate" },
    // { id: "video", label: "Video" },
  ];

  const handleTabChange = (tabId: string) => {
    // Update the global signal
    dispatchUiEvents.changeAppMode(tabId as "realtime" | "edit" | "generate");
  };

  const generationState = generationSignal.value;

  console.log(appMode.value);

  return (
    <div
      className={twMerge(
        "relative z-50 flex h-fit w-fit items-center gap-8 pl-1 pr-4",
      )}
    >
      <img
        src="/brand/mira-logo.png"
        alt="logo"
        className="h-[30px] select-none pb-1"
      />

      <TabSelector
        tabs={tabs}
        activeTab={activeTab.value}
        onTabChange={handleTabChange}
        disabled={
          generationState.loadingState === GenerationLoadingState.GENERATING
        }
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
