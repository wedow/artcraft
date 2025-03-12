import { twMerge } from "tailwind-merge";
import { TabSelector, TabItem } from "~/components/ui/TabSelector";
import { useComputed } from "@preact/signals-react";
import { appMode, dispatchUiEvents } from "~/signals";

// import { paperWrapperStyles } from "~/components/styles";
// import { faPlus, faQuestion } from "@fortawesome/pro-solid-svg-icons";
// import { ToolbarButton } from "~/components/features/ToolbarButton";

export const ToolbarTopLeft = () => {
  // Use the appMode signal directly with useComputed for reactivity - active tab sets the app mode
  const activeTab = useComputed(() => appMode.value);

  const tabs: TabItem[] = [
    { id: "image", label: "Image" },
    { id: "edit", label: "Edit" },
    // { id: "video", label: "Video" },
  ];

  const handleTabChange = (tabId: string) => {
    // Update the global signal
    dispatchUiEvents.changeAppMode(tabId as "image" | "edit");
  };

  console.log(appMode.value);

  return (
    <div className={twMerge("z-20 flex h-fit w-fit items-center gap-8 px-4")}>
      <img
        src="/brand/mira-logo.png"
        alt="logo"
        className="h-[30px] select-none pb-1"
      />

      <TabSelector
        tabs={tabs}
        activeTab={activeTab.value}
        onTabChange={handleTabChange}
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
