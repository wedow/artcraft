import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { posthog } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Toaster } from "~/components/ui/Toast";
import { JobProvider } from "~/components/JobContext";
import "./global.css";
import { useRenderCounter } from "~/hooks/useRenderCounter";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";
function PostHogInit() {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
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
        <JobProvider>
          <PostHogProvider client={posthog}>
            <RouterProvider router={router} />
            <Toaster />
          </PostHogProvider>
        </JobProvider>
      </StrictMode>
    );
  }
  return (
    <>
      <PostHogProvider client={posthog}>
        <JobProvider>
          <RouterProvider router={router} />
          <Toaster />
        </JobProvider>
      </PostHogProvider>
    </>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
