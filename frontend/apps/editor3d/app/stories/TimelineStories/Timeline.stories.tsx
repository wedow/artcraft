import type { Meta, StoryObj } from "@storybook/react";

import { Timeline } from "~/pages/PageEnigma/comps/Timeline";
import { pageHeight, pageWidth } from "~/signals";
import { timelineHeight } from "~/pages/PageEnigma/signals";
import { RenderStoryContent } from "~/stories/TimelineStories/RenderStoryContent";

const meta: Meta<typeof Timeline> = {
  component: Timeline,
  render: () => {
    return <RenderStoryContent />;
  },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

export const TimelineDocumentation: Story = {
  loaders: [
    () => {
      pageHeight.value = 300;
      pageWidth.value = window.innerWidth - 32;
      timelineHeight.value = 280;
    },
  ],
};
