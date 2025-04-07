import type { Meta, StoryObj } from "@storybook/react";
import { ButtonLink } from "./ButtonLink";
import { withActions } from "@storybook/addon-actions/decorator";
import { faAngleLeft } from "@fortawesome/pro-solid-svg-icons";

const meta: Meta<typeof ButtonLink> = {
  component: ButtonLink,
  parameters: {
    actions: {
      handles: ["click"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof ButtonLink>;

export const Primary: Story = {
  render: () => (
    <ButtonLink to="google.com" variant="primary">
      Primary
    </ButtonLink>
  ),
};

export const Secondary: Story = {
  render: () => (
    <ButtonLink to="google.com" variant="secondary">
      Secondary
    </ButtonLink>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <ButtonLink to="google.com" variant="secondary" icon={faAngleLeft}>
      Icon
    </ButtonLink>
  ),
};

export default meta;
