import { faImage } from "@fortawesome/pro-solid-svg-icons";
import { withActions } from "@storybook/addon-actions/decorator";
import type { Meta, StoryObj } from "@storybook/react";
import { ButtonIconStack } from "./ButtonIconStack";

const meta: Meta<typeof ButtonIconStack> = {
  component: ButtonIconStack,
  parameters: {
    actions: {
      handles: ["click"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof ButtonIconStack>;

export const Default: Story = {
  render: () => (
    <ButtonIconStack
      onClick={() => { }}
      icon={faImage}
      text={"Start Frame"}
    />
  ),
};

export default meta;
