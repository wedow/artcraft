import React, { useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { LoadingDots, TopBar } from "~/components";
import { Controls3D } from "./comps/Controls3D";
import { ControlsTopButtons } from "./comps/ControlsTopButtons";
import { ControlPanelSceneObject } from "./comps/ControlPanelSceneObject";
import { PreviewEngineCamera } from "./comps/PreviewEngineCamera";
import { PreviewFrameImage } from "./comps/PreviewFrameImage";
import { pageHeight, pageWidth } from "~/signals";
import { PoseModeSelector } from "./comps/PoseModeSelector";
import {
  timelineHeight,
  sidePanelWidth,
  dndTimelineHeight,
  editorLoader,
  cameraAspectRatio,
  outlinerIsShowing,
} from "~/pages/PageEnigma/signals";
import { EditorCanvas } from "./comps/EngineCanvases";
import { SceneContainer } from "./comps/SceneContainer";
import { Outliner } from "./comps/Outliner";
import { CameraAspectRatio } from "./enums";
import { PromptBox } from "./comps/PromptBox";
import { OnboardingHelper } from "./comps/OnboardingHelper";
import { FocalLengthDisplay } from "./comps/FocalLengthDisplay/FocalLengthDisplay";
import { DemoModal } from "@storyteller/ui-demo-modal";

export const PageEditor = () => {
  useSignals();
  //console.log(api());
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

  const height =
    dndTimelineHeight.value > -1
      ? pageHeight.value - dndTimelineHeight.value - 56
      : pageHeight.value - timelineHeight.value - 56;

  const getScale = () => {
    const height = pageHeight.value - timelineHeight.value - 56;
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
      <OnboardingHelper />
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
          }}
        >
          <div className="relative w-full overflow-hidden bg-transparent">
            <SceneContainer>
              <EditorCanvas />
              <PreviewFrameImage />
            </SceneContainer>

            {/* Focal Length Display */}
            <FocalLengthDisplay />

            {/* Pose Mode Selector */}
            <PoseModeSelector />

            {/* Top controls */}
            <div
              className="absolute left-0 top-0 w-full"
              onClick={handleOverlayClick}
            >
              <div className="grid grid-cols-3 gap-4">
                <ControlsTopButtons />
                <Controls3D />
              </div>
            </div>

            {/* Bottom controls */}
            <div
              className="absolute bottom-0 left-0"
              style={{
                width: pageWidth.value,
              }}
              onClick={handleOverlayClick}
            >
              <div
                className="absolute bottom-0 mb-4 ml-4 flex origin-bottom-left flex-col gap-2"
                style={{ transform: `scale(${getScale()})` }}
              >
                <Outliner />
                <PreviewEngineCamera />
              </div>

              <ControlPanelSceneObject />
            </div>

            <PromptBox />

            <LoadingDots
              className="absolute left-0 top-0 z-50"
              isShowing={editorLoader.value.isShowing}
              type="bricks"
              message={editorLoader.value.message}
            />
          </div>
        </div>

        {/* Side panel */}
        {/* <div onClick={handleOverlayClick}>
          <SidePanel />
        </div> */}
      </div>

      {/* Timeline */}
      {/* <div onClick={handleOverlayClick}>
        <Timeline />
      </div> */}

      <DemoModal
        title="Welcome to ArtCraft 3D"
        subTitle="Your 3D editor for digital art and design"
        description="Set up your scene by adding objects and start bringing your ideas to life!"
        videoSrc="/resources/videos/artcraft-3d-demo.mp4"
        buttonText="Sign in to OpenAI to get started"
        buttonOnClick={() => {}}
      />
    </div>
  );
};
