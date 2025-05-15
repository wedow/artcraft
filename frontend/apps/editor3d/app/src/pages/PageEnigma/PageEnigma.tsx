import { TrackProvider } from "~/pages/PageEnigma/contexts/TrackContext/TrackProvider";
import { DragComponent } from "~/pages/PageEnigma/comps/DragComponent/DragComponent";
import { EngineProvider } from "./contexts/EngineContext";
import { useActiveJobs } from "~/hooks/useActiveJobs";
import { useBackgroundLoadingMedia } from "~/hooks/useBackgroundLoadingMedia";
import { useQueueHandler } from "./hooks/useQueueHandler";
import { ErrorDialog, LoadingDots } from "~/components";
import { GenerateModals } from "~/pages/PageEnigma/comps/GenerateModals/GenerateModals";
import { Toaster } from "@storyteller/ui-toaster";
import { EditorLoadingBar } from "./comps/EditorLoadingBar";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useState } from "react";
import * as gpu from "detect-gpu";
import { UsersApi } from "~/Classes/ApiManager";
import { TurnOnGpu } from "~/pages/PageEnigma/TurnOnGpu";
import { PrecisionSelector } from "./comps/PrecisionSelector/PrecisionSelector";
import {
  precisionSelectedValue,
  precisionSelectorMenuCoords,
  precisionSelectorValues,
  showPrecisionSelector,
} from "./signals/precisionSelectorMenu";
import { InstallSounds } from "~/pages/PageEnigma/InstallSounds";
import { useImageGenerationFailureEvent } from "./TauriEvents/useImageGenerationFailureEvent";
import { useImageGenerationSuccessEvent } from "./TauriEvents/useImageGenerationSuccessEvent";
import { PageEditor } from "~/pages/PageEnigma/PageEditor";
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
      console.log("GPU tier", gpuTier);
      // Previous implementation:
      //
      //   if (gpuTier.gpu === "apple gpu (Apple GPU)") {
      //     setValidGpu("valid");
      //   }
      //   setValidGpu(gpuTier.type !== "BENCHMARK" ? "error" : "valid");
      //

      let isValid = false;

      // TODO: Not sure what this test does.
      //if (gpuTier.type === "BENCHMARK") {
      //  isValid = true;
      //}

      const fps = gpuTier.fps || 0;

      if (gpuTier.tier > 1) {
        // Tier 2 and above is an estimated 30 FPS and above of rendering power.
        // https://www.npmjs.com/package/detect-gpu
        isValid = true;
      }

      if (fps > 15) {
        isValid = true;
      }

      switch (gpuTier.gpu) {
        case "apple gpu (Apple GPU)":
          // TODO(bt,2025-04-08): We may want to disable this heuristic.
          // We're getting lack of hardware acceleration using Tauri on Mac and Linux.
          isValid = true;
          break;
        default:
          break;
      }

      setValidGpu(isValid ? "valid" : "error");
    });
  });

  useImageGenerationSuccessEvent();
  useImageGenerationFailureEvent();

  useEffect(() => {
    console.log("installing event listeners");
    InstallSounds();
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
        <PageEditor />
        <DragComponent />
        <PrecisionSelector
          showSignal={showPrecisionSelector}
          coordSignal={precisionSelectorMenuCoords}
          valuesSignal={precisionSelectorValues}
          selectedValueSignal={precisionSelectedValue}
        />
        <GenerateModals />
        <ErrorDialog />
        {/* <Wizard /> */}
      </EngineProvider>
      <EditorLoadingBar />
      <Toaster offsetTop={70} offsetRight={12} />
    </TrackProvider>
  );
};
