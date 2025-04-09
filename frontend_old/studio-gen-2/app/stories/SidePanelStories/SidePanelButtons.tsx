import { Button } from "~/components";
import { selectedTab, sidePanelVisible } from "~/pages/PageEnigma/signals";
import { tabList } from "~/pages/PageEnigma/comps/SidePanel/tabList";

export const SidePanelButtons = () => {
  return (
    <div>
      <Button
        onClick={() => {
          if (!sidePanelVisible.value) {
            sidePanelVisible.value = true;
          }
          selectedTab.value = tabList[0];
        }}
      >
        Character Panel
      </Button>
      <Button
        onClick={() => {
          if (!sidePanelVisible.value) {
            sidePanelVisible.value = true;
          }
          selectedTab.value = tabList[1];
        }}
      >
        Animations Panel
      </Button>
      <Button
        onClick={() => {
          if (!sidePanelVisible.value) {
            sidePanelVisible.value = true;
          }
          selectedTab.value = tabList[2];
        }}
      >
        Expressions Panel
      </Button>
      <Button
        onClick={() => {
          if (!sidePanelVisible.value) {
            sidePanelVisible.value = true;
          }
          selectedTab.value = tabList[3];
        }}
      >
        Objects Panel
      </Button>
      <Button
        onClick={() => {
          if (!sidePanelVisible.value) {
            sidePanelVisible.value = true;
          }
          selectedTab.value = tabList[4];
        }}
      >
        Audio Panel
      </Button>
      <Button
        onClick={() => {
          if (!sidePanelVisible.value) {
            sidePanelVisible.value = true;
          }
          selectedTab.value = tabList[5];
        }}
      >
        Stylize Panel
      </Button>
    </div>
  );
};
