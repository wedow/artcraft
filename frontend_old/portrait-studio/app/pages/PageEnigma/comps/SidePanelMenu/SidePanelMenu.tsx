import { useSignals } from "@preact/signals-react/runtime";
import { twMerge } from "tailwind-merge";
import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureFlag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FeatureFlags, TabTitles } from "~/enums";
import { EditorStates } from "~/pages/PageEnigma/enums";
import { editorState } from "~/pages/PageEnigma/signals/engine";
import { sidePanelVisible } from "~/pages/PageEnigma/signals/sidePanel";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { TabItem } from "../SidePanel/tabList";
import { currentPage, pageHeight } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";

export const SidePanelMenu = ({
  tabs,
  selectTab,
  selectedTab,
}: {
  tabs: TabItem[];
  selectTab: (newSelectedTab: TabItem) => void;
  selectedTab: TabItem;
}) => {
  useSignals();
  const showSetsTab = usePosthogFeatureFlag(FeatureFlags.SHOW_SETS_TAB);
  const showSkyboxesTab = usePosthogFeatureFlag(FeatureFlags.SHOW_SKYBOXES_TAB);
  const showCreaturesTab = usePosthogFeatureFlag(
    FeatureFlags.SHOW_CREATURES_TAB,
  );
  const showStylePage = usePosthogFeatureFlag(FeatureFlags.SHOW_STYLE_PAGE);
  return (
    <div
      className={twMerge(
        "fixed right-0 top-[56px] z-[25] w-[84px] overflow-y-auto border-r bg-assets-background p-1.5 px-2 py-2",
        sidePanelVisible.value ? "border-transparent" : "border-[#3F3F3F]",
      )}
      style={{
        height: pageHeight.value,
        minWidth: 75,
        maxWidth: 75,
        left: 0,
        top: 56,
      }}
    >
      <div className="flex w-full flex-col gap-2">
        {(tabs ?? []).map((tab) => {
          if (tab.title === TabTitles.OBJECTS_SETS && !showSetsTab) {
            return;
          }
          if (tab.title === TabTitles.SKYBOXES && !showSkyboxesTab) {
            return;
          }
          if (tab.title === TabTitles.OBJECTS_CREATURES && !showCreaturesTab) {
            return;
          }
          if (tab.title === TabTitles.RENDER && !showStylePage) {
            return;
          }
          return (
            <button
              key={tab.title}
              className={twMerge([
                "flex flex-col items-center rounded-lg border border-transparent px-2 py-3 transition-all duration-200 hover:bg-assets-selectedTab",
                tab.title === selectedTab.title && sidePanelVisible.value
                  ? "border-[#3F3F3F] bg-assets-selectedTab opacity-100 hover:bg-assets-selectedTab"
                  : "opacity-60",
                tab.title === TabTitles.RENDER &&
                  "bg-brand-primary font-medium opacity-90 hover:border-white/25 hover:bg-brand-primary hover:opacity-100",
                tab.title === selectedTab.title &&
                tab.title === TabTitles.RENDER
                  ? "border-white/50 opacity-100 hover:border-white/50"
                  : "",
              ])}
              onClick={() => {
                if (tab.title === TabTitles.RENDER) {
                  currentPage.value = Pages.STYLE;
                  return;
                }
                selectTab(tab);
                if (!sidePanelVisible.value) {
                  sidePanelVisible.value = true;
                }
                if (editorState.value === EditorStates.PREVIEW) {
                  Queue.publish({
                    queueName: QueueNames.TO_ENGINE,
                    action: toEngineActions.ENTER_EDIT_STATE,
                    data: null,
                  });
                }
              }}
            >
              <div>
                <FontAwesomeIcon icon={tab.icon} size="lg" />
              </div>
              <div className="-mb-1 mt-1 text-nowrap" style={{ fontSize: 11 }}>
                {tab.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
