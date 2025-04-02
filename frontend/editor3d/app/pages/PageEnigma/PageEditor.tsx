import React, { useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { LoadingDots, Toaster, TopBar } from "~/components";
import { SidePanel } from "~/pages/PageEnigma/comps/SidePanel";
import { Timeline } from "./comps/Timeline";
import { Controls3D } from "./comps/Controls3D";
import { ControlsTopButtons } from "./comps/ControlsTopButtons";
import { ControlsVideo } from "./comps/ControlsVideo";
import { ControlPanelSceneObject } from "./comps/ControlPanelSceneObject";
import { PreviewEngineCamera } from "./comps/PreviewEngineCamera";
import { PreviewFrameImage } from "./comps/PreviewFrameImage";

import { pageHeight, pageWidth } from "~/signals";

import {
  timelineHeight,
  sidePanelWidth,
  sidePanelVisible,
  dndSidePanelWidth,
  dndTimelineHeight,
  editorLoader,
  cameraAspectRatio,
  outlinerIsShowing,
} from "~/pages/PageEnigma/signals";
import { EditorCanvas } from "./comps/EngineCanvases";
import { SceneContainer } from "./comps/SceneContainer";
import { AspectRatioMenu } from "./comps/AspectRatioMenu";
import { Outliner } from "./comps/Outliner";
import { CameraAspectRatio } from "./enums";
import { PromptBox } from "./comps/PromptBox";

export const PageEditor = () => {
  useSignals();

  //To prevent the click event from propagating to the canvas: TODO: HANDLE THIS BETTER?
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    timelineHeight.value = 0; //timelineHeight.value = 208;
    sidePanelWidth.value = 340;
    window.onbeforeunload = () => {
      return "You may have unsaved changes.";
    };
  }, []);

  const dndWidth =
    dndSidePanelWidth.value > -1
      ? dndSidePanelWidth.value
      : sidePanelWidth.value;
  const width = sidePanelVisible.value
    ? pageWidth.value - dndWidth - 84
    : pageWidth.value - 84;
  const height =
    dndTimelineHeight.value > -1
      ? pageHeight.value - dndTimelineHeight.value - 64
      : pageHeight.value - timelineHeight.value - 64;

  const getScale = () => {
    const height = pageHeight.value - timelineHeight.value - 64;
    const scaleHeight = height < 610 ? height / 610 : 1;

    if (
      cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16 &&
      outlinerIsShowing.value &&
      height < 900
    ) {
      if (pageWidth.value > 2000) {
        return scaleHeight;
      }
      return scaleHeight * 0.78;
    }

    if (
      cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1 &&
      pageWidth.value < 2000
    ) {
      return scaleHeight * 0.85;
    }

    return scaleHeight;
  };

  return (
    <div className="w-screen">
      <TopBar pageName="Edit Scene" />
      <div
        className="relative flex w-screen"
        style={{ height: "calc(100vh - 68px)" }}
      >
        {/* Engine section/side panel */}
        <div
          id="engine-n-panels-wrapper"
          className="flex"
          style={{
            height,
            width,
          }}
        >
          <div className="relative w-full overflow-hidden bg-transparent">
            <SceneContainer>
              <Toaster />
              <EditorCanvas />
              <PreviewFrameImage />
            </SceneContainer>

            {/* Top controls */}
            <div
              className="absolute left-0 top-0 w-full"
              onClick={handleOverlayClick}
            >
              <div className="grid grid-cols-3 gap-4">
                <ControlsTopButtons />
                <Controls3D />
                <AspectRatioMenu />
              </div>
            </div>

            {/* Bottom controls */}
            <div
              className="absolute bottom-0 left-0"
              style={{
                width:
                  pageWidth.value -
                  (sidePanelVisible.value ? sidePanelWidth.value : 0) -
                  84,
              }}
              onClick={handleOverlayClick}
            >
              <div
                className="absolute bottom-0 mb-2 ml-2 flex origin-bottom-left flex-col gap-2"
                style={{ transform: `scale(${getScale()})` }}
              >
                <Outliner />
                <PreviewEngineCamera />
              </div>
              <PromptBox />
              <ControlPanelSceneObject />
            </div>

            <LoadingDots
              className="absolute left-0 top-0"
              isShowing={editorLoader.value.isShowing}
              type="bricks"
              message={editorLoader.value.message}
            />
          </div>
        </div>
        {/* Side panel */}
        <div onClick={handleOverlayClick}>
          <SidePanel />
        </div>
      </div>

      {/* Timeline */}
      {/* <div onClick={handleOverlayClick}>
        <Timeline />
      </div> */}
    </div>
  );
};
