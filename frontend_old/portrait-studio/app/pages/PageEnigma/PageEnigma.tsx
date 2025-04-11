import { TrackProvider } from "~/pages/PageEnigma/contexts/TrackContext/TrackProvider";
import { DragComponent } from "~/pages/PageEnigma/comps/DragComponent/DragComponent";
import { EngineProvider } from "./contexts/EngineContext";
import { useActiveJobs } from "~/hooks/useActiveJobs";
import { useBackgroundLoadingMedia } from "~/hooks/useBackgroundLoadingMedia";
import { useQueueHandler } from "./hooks/useQueueHandler";
import { ErrorDialog, LoadingDots } from "~/components";
import { GenerateModals } from "~/pages/PageEnigma/comps/GenerateModals/GenerateModals";

import { EditorLoadingBar } from "./comps/EditorLoadingBar";

import { Wizard } from "~/pages/PageEnigma/Wizard/Wizard";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useState } from "react";
import * as gpu from "detect-gpu";
import { UsersApi } from "~/Classes/ApiManager";
import { PageEnigmaComponent } from "~/pages/PageEnigma/PageEnigmaComponent";
import { TurnOnGpu } from "~/pages/PageEnigma/TurnOnGpu";

export const PageEnigma = ({ sceneToken }: { sceneToken?: string }) => {
  useSignals();
  useActiveJobs();
  useBackgroundLoadingMedia();
  // implement the code to handle incoming messages from the Engine
  useQueueHandler();

  const [validGpu, setValidGpu] = useState("unknown");

  useEffect(() => {
    const usersApi = new UsersApi();
    const sessionResponse = usersApi.GetSession();
    sessionResponse.then((result) => {
      console.log(
        `User Info | Username: ${result.data?.user?.username}, Token: ${result.data?.user?.user_token}`,
      );
    });
  });

  useEffect(() => {
    const { getGPUTier } = gpu;
    getGPUTier().then((gpuTier) => {
      console.log(gpuTier);
      if (gpuTier.gpu === "apple gpu (Apple GPU)") {
        setValidGpu("valid");
      }
      setValidGpu(gpuTier.type !== "BENCHMARK" ? "error" : "valid");
    });
  });

  if (validGpu === "unknown") {
    return <LoadingDots />;
  }
  if (validGpu === "error") {
    return <TurnOnGpu />;
  }

  return (
    <TrackProvider>
      <EngineProvider sceneToken={sceneToken}>
        <PageEnigmaComponent />
        <DragComponent />
        <GenerateModals />
        <ErrorDialog />
        <Wizard />
      </EngineProvider>
      <EditorLoadingBar />
    </TrackProvider>
  );
};
