import { useSignals } from "@preact/signals-react/runtime";
import { sidePanelHeight } from "~/pages/PageEnigma/signals";

import { useMouseEventsSidePanel } from "~/pages/PageEnigma/comps/Timeline/utils/useMouseEventsSidePanel";
import { TabItem } from "../SidePanel/tabList";

export const SidePanelTabs = ({
  selectedTab,
  tabs,
}: {
  selectedTab: TabItem;
  tabs: TabItem[];
}) => {
  useSignals();
  const { onPointerDown } = useMouseEventsSidePanel();

  return (
    <>
      <div style={{ height: sidePanelHeight.value, width: "100%" }}>
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={
              tab.title === selectedTab.title
                ? "flex h-full flex-col gap-3.5 overflow-y-auto"
                : "hidden"
            }
          >
            {tab.component}
          </div>
        ))}
      </div>
      <div
        className="absolute right-10 z-10 block w-1 cursor-ew-resize"
        style={{ height: sidePanelHeight.value }}
        onPointerDown={onPointerDown}
      />
    </>
  );
};
