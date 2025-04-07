import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { withActions } from "@storybook/addon-actions/decorator";
import { faUser } from "@fortawesome/pro-solid-svg-icons";

const meta: Meta<typeof Input> = {
  component: Input,
  parameters: {
    actions: {
      handles: ["change", "blur", "focus"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => (
    <div className="bg-action p-8">
      <Input placeholder="field placeholder" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="bg-action p-8">
      <Input icon={faUser} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="bg-action p-8">
      <Input label="Input label" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="bg-action p-8">
      <Input errorMessage="Error message" />
    </div>
  ),
};

export default meta;
