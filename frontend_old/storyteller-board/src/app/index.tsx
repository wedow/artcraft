import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { posthog } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import "./global.css";
import { useRenderCounter } from "~/hooks/useRenderCounter";

function PostHogInit() {
  const apiKey = "phc_jBFgac0mVALAFk3negnSfYCcHgvkT00yBLQDmCDYNBb";
  posthog.init(apiKey, {
    api_host: "https://us.i.posthog.com/",
    ui_host: "https://us.i.posthog.com/",
  });
}

const App = () => {
  const useStrictMode = false;
  useRenderCounter("App");
  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }
    PostHogInit();
  }, []);
  if (useStrictMode) {
    return (
      <StrictMode>
        <PostHogProvider client={posthog}>
          <RouterProvider router={router} />
        </PostHogProvider>
      </StrictMode>
    );
  }
  return <RouterProvider router={router} />;
};

createRoot(document.getElementById("root")!).render(<App />);
