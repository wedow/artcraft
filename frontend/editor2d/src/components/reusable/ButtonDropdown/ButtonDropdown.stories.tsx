import type { Meta, StoryObj } from "@storybook/react";
import { ButtonDropdown } from "./ButtonDropdown";
import { withActions } from "@storybook/addon-actions/decorator";
import { faAngleLeft, faFile } from "@fortawesome/pro-solid-svg-icons";

const meta: Meta<typeof ButtonDropdown> = {
  component: ButtonDropdown,
  parameters: {
    actions: {
      handles: ["click"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof ButtonDropdown>;

export const OpenDialog: Story = {
  render: () => (
    <ButtonDropdown
      label="Dialog Options"
      icon={faFile}
      options={[
        {
          label: "Open Dialog",
          description: "Desc 1",
          onDialogOpen: () => {
            //console.log("Opened Dialog");
          },
          dialogProps: {
            title: "Dialog Title",
            content: <div className="text-white">Dialog content here...</div>,
            confirmButtonProps: {
              label: "Create",
              disabled: false,
              onClick: () => {
                //console.log("Action on Dialog");
              },
            },
            closeButtonProps: {
              label: "Cancel",
            },
            showClose: true,
            onClose: () => {
              //console.log("Closed Dialog");
            },
          },
        },
        {
          label: "Disabled",
          description: "Desc 2",
          disabled: true,
        },
      ]}
    />
  ),
};

export const ClickEvent: Story = {
  render: () => (
    <ButtonDropdown
      label="Event Options"
      icon={faFile}
      options={[
        {
          label: "Click Event",
          description: "Desc",
          onClick: () => {
            //console.log("Clicked");
          },
        },
      ]}
    />
  ),
};

export default meta;
