import type { Meta, StoryObj } from "@storybook/react";
import { Pill } from "./Pill";

const meta: Meta<typeof Pill> = {
  component: Pill,
  parameters: {},
};

type Story = StoryObj<typeof Pill>;

export const Default: Story = {
  render: () => <Pill>A Pill</Pill>,
};

export default meta;
