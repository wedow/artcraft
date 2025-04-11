import { useState } from "react";
import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureFlag";
import { FeatureFlags } from "~/enums";
import { useSignals } from "@preact/signals-react/runtime";
import {
  dndSidePanelWidth,
  sidePanelVisible,
  sidePanelWidth,
} from "~/pages/PageEnigma/signals";

import { SidePanelTabs } from "~/pages/PageEnigma/comps/SidePanelTabs";
import { SidePanelMenu } from "~/pages/PageEnigma/comps/SidePanelMenu";
import { TabItem, tabList } from "./tabList";

export const SidePanel = () => {
  useSignals();
  const initialTabIdx = usePosthogFeatureFlag(FeatureFlags.SHOW_SETS_TAB)
    ? 0
    : 0;
  const [selectedTab, setSelectedTab] = useState<TabItem>(
    tabList[initialTabIdx],
  );

  const displayWidth =
    dndSidePanelWidth.value > -1
      ? dndSidePanelWidth.value
      : sidePanelWidth.value;

  return (
    <>
      <div
        className={[
          "fixed z-20 flex border-r border-r-[#3F3F3F] bg-ui-panel transition-all duration-100",
        ].join(" ")}
        style={{
          top: 56,
          left: sidePanelVisible.value ? 75 : -320,
          width: displayWidth,
        }}
      >
        <div className="relative block h-full w-full bg-ui-panel">
          <SidePanelTabs tabs={tabList} selectedTab={selectedTab} />
        </div>
      </div>
      <SidePanelMenu
        tabs={tabList}
        selectedTab={selectedTab}
        selectTab={(newSelectedTab) => {
          setSelectedTab(newSelectedTab);
        }}
      />
    </>
  );
};
