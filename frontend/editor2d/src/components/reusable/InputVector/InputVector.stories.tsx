import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { InputVector } from "./InputVector";
import { withActions } from "@storybook/addon-actions/decorator";

const meta: Meta<typeof InputVector> = {
  component: InputVector,
  parameters: {
    actions: {
      handles: ["change", "blur", "focus"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof InputVector>;

const InputVectorRender = () => {
  // Sets the hooks for both the label and primary props
  const [xyz, setXyz] = useState<Record<string, string>>({
    x: "0",
    y: "0",
    z: "0",
  });

  return (
    <InputVector
      x={xyz.x}
      y={xyz.y}
      z={xyz.z}
      onChange={(value) => setXyz(value)}
    />
  );
};

export const Default: Story = {
  render: () => (
    <div className="bg-action p-8">
      <InputVectorRender />
    </div>
  ),
};

export default meta;
