import type { Meta, StoryObj } from "@storybook/react";
import { ButtonIconSelect } from "./ButtonIconSelect";
import { withActions } from "@storybook/addon-actions/decorator";
import { faAngleLeft, faAngleRight } from "@fortawesome/pro-solid-svg-icons";

const meta: Meta<typeof ButtonIconSelect> = {
  component: ButtonIconSelect,
  parameters: {
    actions: {
      handles: ["click"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof ButtonIconSelect>;

export const Default: Story = {
  render: () => (
    <ButtonIconSelect
      onOptionChange={() => {}}
      options={[
        {
          value: "V1",
          icon: faAngleLeft,
          text: "Select 1",
        },
        {
          value: "V2",
          icon: faAngleRight,
          text: "Select 2",
        },
      ]}
    />
  ),
};

export default meta;
