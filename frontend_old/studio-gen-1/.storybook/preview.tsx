import type { Preview } from "@storybook/react";
import "tailwindcss/tailwind.css";
import "../app/styles/tailwind.css";
import "../app/styles/normalize.css?url";
import "../app//styles/tailwind.css?url";
import "../app//styles/base.css?url";
import { MemoryRouter } from "react-router";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (story) => <MemoryRouter initialEntries={["/"]}>{story()}</MemoryRouter>,
  ],
};

export default preview;
