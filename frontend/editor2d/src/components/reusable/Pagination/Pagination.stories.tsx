import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./Pagination";
import { withActions } from "@storybook/addon-actions/decorator";

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  parameters: {
    actions: {
      handles: ["pageChange"],
    },
  },
  decorators: [withActions],
};

type Story = StoryObj<typeof Pagination>;

export const Empty: Story = {
  render: () => (
    <div className="w-[300px] bg-brand-secondary-200">
      <Pagination
        className=""
        currentPage={0}
        totalPages={0}
        onPageChange={() => {}}
      />
    </div>
  ),
};

export const FirstPage: Story = {
  render: () => (
    <div className="w-[300px] bg-brand-secondary-200">
      <Pagination
        className=""
        currentPage={0}
        totalPages={5}
        onPageChange={() => {}}
      />
    </div>
  ),
};

export const Middle: Story = {
  render: () => (
    <div className="w-[300px] bg-brand-secondary-200">
      <Pagination
        className=""
        currentPage={2}
        totalPages={5}
        onPageChange={() => {}}
      />
    </div>
  ),
};

export const LastPage: Story = {
  render: () => (
    <div className="w-[300px] bg-brand-secondary-200">
      <Pagination
        className=""
        currentPage={4}
        totalPages={5}
        onPageChange={() => {}}
      />
    </div>
  ),
};

export default meta;
