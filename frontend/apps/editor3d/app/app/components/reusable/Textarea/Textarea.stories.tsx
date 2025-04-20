import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { withActions } from "@storybook/addon-actions/decorator";

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  parameters: {
    actions: {
      handles: ["change", "blur", "focus"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => (
    <div className="bg-action p-8">
      <Textarea placeholder="field placeholder" />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="bg-action p-8">
      <Textarea label="Label" />
    </div>
  ),
};

export default meta;
