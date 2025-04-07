import type { Meta, StoryObj } from "@storybook/react";
import { ButtonIcon } from "./ButtonIcon";
import { withActions } from "@storybook/addon-actions/decorator";
import { faAngleLeft } from "@fortawesome/pro-solid-svg-icons";

const meta: Meta<typeof ButtonIcon> = {
  component: ButtonIcon,
  parameters: {
    actions: {
      handles: ["click"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof ButtonIcon>;

export const Default: Story = {
  render: () => <ButtonIcon icon={faAngleLeft} onClick={() => {}} />,
};

export default meta;
