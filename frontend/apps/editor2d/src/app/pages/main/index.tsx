import { useParams } from "react-router-dom";
import { withProtectionRoute } from "~/components/hoc";
import { useRenderCounter } from "~/hooks/useRenderCounter";
import { Resource, invoke } from "@tauri-apps/api/core";
//Components of the Konva App are all in the KonvaComponent
import { KonvaRootComponent } from "~/KonvaRootComponent";
import { ToolbarTopLeft } from "~/components/features/ToolbarTopLeft";
import { ToolbarTopRight } from "~/components/features/ToolbarTopRight";
import { ToolbarTopCenter } from "~/components/features/ToolbarTopCenter";
import { appMode } from "~/signals";
import { useSignals } from "@preact/signals-react/runtime";
import { GenerationRootComponent } from "~/GenerationRootComponent/GenerationRootComponent";
import { EditModeRootComponent } from "~/EditModeRootComponent/EditModeRootComponent";
import { useRef } from "react";
import { GenerationEngine } from "~/KonvaApp/GenerationEngine";
import { GalleryRootComponent } from "~/GalleryRootComponent";

import { DemoModal } from "@storyteller/ui-demo-modal";

export const isTauri = (): boolean => {
  console.log(window.__TAURI_INTERNALS__);
  return window.__TAURI_INTERNALS__;
};

export const Main = withProtectionRoute(() => {
  // This is a hook that will log the number of times the component has rerendered
  // Let's make sure we only log once
  useRenderCounter("Pages/Main");
  let { sceneToken } = useParams();
  if (import.meta.env.DEV && sceneToken === "debug") {
    sceneToken = "m_p8nkry6m5j22w586xyex0w4a4pznbx";
  }

  useSignals();

  const generationEngineRef = useRef<GenerationEngine | null>(null);
  const appModeValue = appMode.value;
  let childView;

  switch (appModeValue) {
    case "edit":
      childView = (
        <EditModeRootComponent className="col-span-12 col-start-1 row-span-12 row-start-1" />
      );
      break;
    case "generate":
      childView = (
        <GenerationRootComponent generationEngineRef={generationEngineRef} />
      );
      break;
    case "realtime":
    default:
      childView = (
        <KonvaRootComponent
          sceneToken={sceneToken}
          className="col-span-12 col-start-1 row-span-12 row-start-1"
        />
      );

      break;
  }

  return (
    <>
      <div className="fixed h-full w-full">
        <div className="fixed grid h-full w-full grid-cols-12 grid-rows-12">
          {childView}
        </div>
        <div className="absolute top-0 w-full p-3.5">
          <div className="relative flex w-full">
            <div className="absolute left-0">
              <ToolbarTopLeft />
            </div>
            <div className="flex w-full justify-center">
              <ToolbarTopCenter />
            </div>
            <div className="absolute right-0">
              <ToolbarTopRight />
            </div>
          </div>
        </div>
        {appModeValue === "gallery" && (
          <GalleryRootComponent className="z-1 fixed h-full w-full bg-black" />
        )}
      </div>

      <DemoModal
        title="Welcome to ArtCraft Canvas"
        subTitle="Your creative canvas for digital art and design"
        description="Draw freely, create collages, and design with our intuitive tool."
        videoSrc="/videos/artcraft-canvas-demo.mp4"
        buttonText="Sign in to OpenAI to get started"
        buttonOnClick={async () => {
          if (isTauri()) {
            await invoke("open_sora_login_command");
          } else {
            console.error("Tauri is not available in this environment");
          }
        }}
      />
    </>
  );
});
