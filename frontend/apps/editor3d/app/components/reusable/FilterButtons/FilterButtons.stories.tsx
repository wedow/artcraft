import type { Meta, StoryObj } from "@storybook/react";
import { FilterButtons } from "./FilterButtons";
import { withActions } from "@storybook/addon-actions/decorator";
import { AssetFilterOption } from "~/enums";

const meta: Meta<typeof FilterButtons> = {
  component: FilterButtons,
  parameters: {
    actions: {
      handles: ["click"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof FilterButtons>;

export const Featured: Story = {
  render: () => (
    <FilterButtons onClick={() => null} value={AssetFilterOption.FEATURED} />
  ),
};

export const Mine: Story = {
  render: () => (
    <FilterButtons onClick={() => null} value={AssetFilterOption.MINE} />
  ),
};

export const Bookmarked: Story = {
  render: () => (
    <FilterButtons onClick={() => null} value={AssetFilterOption.BOOKMARKED} />
  ),
};

export default meta;
