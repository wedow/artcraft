import { useSignals } from "@preact/signals-react/runtime";
import { pageHeight, pageWidth } from "~/signals";
import { SidePanelButtons } from "~/stories/SidePanelStories/SidePanelButtons";
import {
  dndSidePanelWidth,
  sidePanelVisible,
  sidePanelWidth,
} from "~/pages/PageEnigma/signals";
import { SidePanelTabs } from "~/pages/PageEnigma/comps/SidePanelTabs";

export const RenderStoryContent = () => {
  useSignals();
  const displayWidth =
    dndSidePanelWidth.value > -1
      ? dndSidePanelWidth.value
      : sidePanelWidth.value;

  return (
    <div
      className="relative flex justify-between bg-ui-background"
      style={{ width: pageWidth.value - 32, height: pageHeight.value - 32 }}
    >
      <div>
        <SidePanelButtons />
      </div>
      <div
        className={[
          "fixed",
          "border-l border-l-ui-panel-border bg-ui-panel",
          "flex",
          "transition-all duration-300 ease-in-out",
        ].join(" ")}
        style={{
          top: 16,
          right: 24,
          width: sidePanelVisible.value ? displayWidth : 0,
        }}
      >
        <div className="relative block h-full w-full bg-ui-panel">
          <SidePanelTabs />
        </div>
      </div>
    </div>
  );
};
