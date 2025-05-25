import React from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { poseMode, showPoseControls } from "../signals/selectedMode";
import { Tooltip } from "~/components";
import { Button } from "@storyteller/ui-button"
import { faCheck, faPersonRunning } from "@fortawesome/pro-solid-svg-icons";

declare global {
  interface Window {
    __mouseControls?: {
      toggleFKMode: () => void;
    };
  }
}

interface PoseModeSelectorProps {}

export const PoseModeSelector: React.FC<PoseModeSelectorProps> = () => {
  useSignals();

  const handleModeChange = () => {
    if (poseMode.value === "select") {
      poseMode.value = "pose";
    } else {
      poseMode.value = "select";
    }
    window.__mouseControls?.toggleFKMode();
  };

  if (showPoseControls.value === false) {
    return null;
  }

  return (
    <>
      <div
        className="fixed left-1/2 top-32 flex -translate-x-1/2 transform items-center justify-center gap-2"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Tooltip
          content={"Toggle pose mode (K)"}
          position={"bottom"}
          delay={300}
          closeOnClick={true}
        >
          <>
            {poseMode.value === "select" ? (
              <Button
                icon={faPersonRunning}
                onClick={handleModeChange}
                className="rounded-xl shadow-xl outline-none focus-visible:outline-none"
              >
                Enter Pose Mode
              </Button>
            ) : (
              <Button
                icon={faCheck}
                onClick={handleModeChange}
                className="rounded-xl outline-none  focus-visible:outline-none"
              >
                Done
              </Button>
            )}
          </>
        </Tooltip>
      </div>
    </>
  );
};
