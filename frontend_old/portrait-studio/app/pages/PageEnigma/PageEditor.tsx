import React, { useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { LoadingDots, Toaster, TopBar } from "~/components";
import { SidePanel } from "~/pages/PageEnigma/comps/SidePanel";
import { Controls3D } from "./comps/Controls3D";
import { ControlsTopButtons } from "./comps/ControlsTopButtons";
import { ControlPanelSceneObject } from "./comps/ControlPanelSceneObject";
import { PreviewEngineCamera } from "./comps/PreviewEngineCamera";
import { PreviewFrameImage } from "./comps/PreviewFrameImage";

import { pageHeight, pageWidth } from "~/signals";

import {
  sidePanelWidth,
  sidePanelVisible,
  editorLoader,
  cameraAspectRatio,
  outlinerIsShowing,
  stylizeSidePanelVisible,
  stylizeSidePanelWidth,
} from "~/pages/PageEnigma/signals";
import { EditorCanvas } from "./comps/EngineCanvases";
import { SceneContainer } from "./comps/SceneContainer";
import { AspectRatioMenu } from "./comps/AspectRatioMenu";
import { Outliner } from "./comps/Outliner";
import { CameraAspectRatio } from "./enums";
import { StylizeSidePanel } from "./comps/StylizeSidePanel";

export const PageEditor = () => {
  useSignals();

  //To prevent the click event from propagating to the canvas: TODO: HANDLE THIS BETTER?
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    sidePanelWidth.value = 320;
    stylizeSidePanelWidth.value = 420;
    window.onbeforeunload = () => {
      return "You may have unsaved changes.";
    };
  }, []);

  const width = sidePanelVisible.value
    ? pageWidth.value - sidePanelWidth.value - 75
    : pageWidth.value - 75;
  const height = pageHeight.value - 56;

  const getScale = () => {
    const height = pageHeight.value - 56;
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
        className="relative flex w-screen justify-end"
        style={{ height: "calc(100vh - 56px)" }}
      >
        {/* Engine section */}
        <div
          id="engine-n-panels-wrapper"
          className="flex justify-end"
          style={{
            height,
            width,
            paddingRight: stylizeSidePanelVisible.value
              ? stylizeSidePanelWidth.value
              : 0,
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
                  75,
                paddingRight: stylizeSidePanelVisible.value
                  ? stylizeSidePanelWidth.value
                  : 0,
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
              {/* <ControlsVideo /> */}
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
      </div>

      {/* Side panel */}
      <div onClick={handleOverlayClick}>
        <SidePanel />
      </div>

      <div onClick={handleOverlayClick}>
        <StylizeSidePanel />
      </div>

      {/* Timeline */}
      {/* <div onClick={handleOverlayClick}>
        <Timeline />
      </div> */}
    </div>
  );
};
