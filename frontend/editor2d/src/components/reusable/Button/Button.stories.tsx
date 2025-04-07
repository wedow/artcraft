import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { withActions } from "@storybook/addon-actions/decorator";
import { faAngleLeft } from "@fortawesome/pro-solid-svg-icons";

const meta: Meta<typeof Button> = {
  component: Button,
  parameters: {
    actions: {
      handles: ["click"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  render: () => <Button variant="primary">Primary</Button>,
};

export const Secondary: Story = {
  render: () => <Button variant="secondary">Secondary</Button>,
};

export const Action: Story = {
  render: () => <Button variant="action">Action</Button>,
};

export const WithIconFlip: Story = {
  render: () => (
    <Button variant="secondary" iconFlip icon={faAngleLeft}>
      Icon Flip
    </Button>
  ),
};

export const WithIconNoFlip: Story = {
  render: () => (
    <Button variant="secondary" icon={faAngleLeft}>
      Icon
    </Button>
  ),
};

export default meta;
