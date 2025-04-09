import {
  dndSidePanelWidth,
  sidePanelHeight,
  stylizeActiveTab,
  stylizeSidePanelVisible,
  stylizeSidePanelWidth,
} from "~/pages/PageEnigma/signals";
import { useSignals } from "@preact/signals-react/runtime";
import { StylizeTab } from "../SidePanelTabs/tabComps/StylizeTab/StylizeTab";
import { SegmentedControl } from "~/components";
import { faArrowProgress, faClock } from "@fortawesome/pro-solid-svg-icons";
import { QueueTab } from "../SidePanelTabs/tabComps/StylizeTab/QueueTab";

export const StylizeSidePanel = () => {
  useSignals();

  const handleTabChange = (value: string) => {
    stylizeActiveTab.value = value;
  };

  const displayWidth =
    dndSidePanelWidth.value > -1
      ? dndSidePanelWidth.value
      : stylizeSidePanelWidth.value;

  return (
    <>
      <div
        className={[
          "fixed",
          "z-20 border-l border-l-[#3F3F3F] bg-ui-panel",
          "flex",
          "transition-all duration-300 ease-in-out",
        ].join(" ")}
        style={{
          top: 56,
          right: 0,
          width: stylizeSidePanelVisible.value ? displayWidth : 0,
        }}
      >
        <div className="relative block h-full w-full bg-ui-panel">
          <div style={{ height: sidePanelHeight.value, width: "100%" }}>
            <div className="flex h-full flex-col gap-3.5 overflow-y-auto">
              <div className="p-5 pb-0">
                <SegmentedControl
                  value={stylizeActiveTab.value}
                  onChange={handleTabChange}
                  data={[
                    {
                      label: "Generate",
                      value: "generate",
                      icon: faArrowProgress,
                    },
                    { label: "Queue", value: "queue", icon: faClock },
                  ]}
                />
              </div>
              {stylizeActiveTab.value === "generate" ? (
                <StylizeTab />
              ) : (
                <QueueTab />
              )}
            </div>
          </div>
          <div
            className="absolute right-10 z-10 block w-1 cursor-ew-resize"
            style={{ height: sidePanelHeight.value }}
          />
        </div>
      </div>
    </>
  );
};
