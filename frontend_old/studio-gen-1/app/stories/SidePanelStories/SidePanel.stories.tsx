import type { Meta, StoryObj } from "@storybook/react";

import { environmentVariables, login, pageHeight, pageWidth } from "~/signals";
import {
  selectedTab,
  sidePanelVisible,
  sidePanelWidth,
  timelineHeight,
} from "~/pages/PageEnigma/signals";
import { SidePanelTabs } from "~/pages/PageEnigma/comps/SidePanelTabs";
import { tabList } from "~/pages/PageEnigma/comps/SidePanelTabs/tabList";
import { RenderStoryContent } from "./RenderStoryContent";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";

const meta: Meta<typeof SidePanelTabs> = {
  component: SidePanelTabs,
  render: () => {
    return <RenderStoryContent />;
  },
};

EnvironmentVariables.initialize({ BASE_API: "", CDN_API: "" });

export default meta;
type Story = StoryObj<typeof SidePanelTabs>;

export const SidePanelDocumentation: Story = {
  loaders: [
    () => {
      pageHeight.value = window.innerHeight;
      pageWidth.value = window.innerWidth;
      timelineHeight.value = -32;
      sidePanelWidth.value = 340;
      sidePanelVisible.value = true;
      selectedTab.value = tabList[0];
      environmentVariables.value = { BASE_API: "", CDN_API: "" };
    },
    async () => {
      await login({ password: "SEptember30!", usernameOrEmail: "coliphant" });
    },
  ],
};
