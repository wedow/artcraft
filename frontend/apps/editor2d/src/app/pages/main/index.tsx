import { useParams } from "react-router-dom";
import { withProtectionRoute } from "~/components/hoc";
import { useRenderCounter } from "~/hooks/useRenderCounter";

// Components of the page
import { ToolbarUserProfile } from "~/components/features";

//Components of the Konva App are all in the KonvaComponent
import { KonvaRootComponent } from "~/KonvaRootComponent";
import { ToolbarTopLeft } from "~/components/features/ToolbarTopLeft";
import { ToolbarTopRight } from "~/components/features/ToolbarTopRight";
import { ToolbarTopCenter } from "~/components/features/ToolbarTopCenter";
import { appMode } from "~/signals";
import { useSignals } from "@preact/signals-react/runtime";
import { GenerationRootComponent } from "~/GenerationRootComponent/GenerationRootComponent";
import { EditModeRootComponent } from "~/EditModeRootComponent/EditModeRootComponent";
import { useRef, useState } from "react";
import { EngineType } from "~/KonvaApp";
import { GenerationEngine } from "~/KonvaApp/GenerationEngine";
import { GalleryRootComponent } from "~/GalleryRootComponent";
import { BaseDialog } from "~/components/ui/BaseDialog";
import { Button } from "~/components/ui/Button";
import {
  faArrowRight,
  faMagicWandSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const Main = withProtectionRoute(() => {
  // This is a hook that will log the number of times the component has rerendered
  // Let's make sure we only log once
  useRenderCounter("Pages/Main");
  let { sceneToken } = useParams();
  if (import.meta.env.DEV && sceneToken === "debug") {
    sceneToken = "m_p8nkry6m5j22w586xyex0w4a4pznbx";
  }

  useSignals();

  const realtimeEngineRef = useRef<EngineType | null>(null);
  const generationEngineRef = useRef<GenerationEngine | null>(null);
  const [firstTimeDialogOpen, setFirstTimeDialogOpen] = useState(true);

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
      <BaseDialog
        isOpen={firstTimeDialogOpen}
        onClose={() => {
          setFirstTimeDialogOpen(false);
        }}
        className="max-w-5xl"
      >
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-3xl font-bold">
              <FontAwesomeIcon
                icon={faMagicWandSparkles}
                className="mr-3 text-[24px]"
              />
              Welcome to ArtCraft
            </h1>
            <div className="text-center">
              <p className="text-lg font-medium text-white/80">
                Your creative canvas for digital art and design
              </p>
              <p className="text-white/60">
                Draw freely, create collages, and design with our intuitive
                tool. Bring your ideas to life in seconds!
              </p>
            </div>
          </div>

          <div className="aspect-video w-full overflow-hidden rounded-md">
            <video autoPlay muted loop controls={false}>
              <source src="/videos/demo_video.mp4" type="video/mp4" />
            </video>
          </div>
          <Button
            className="px-4 py-3 font-semibold"
            icon={faArrowRight}
            iconFlip={true}
            onClick={() => {
              setFirstTimeDialogOpen(false);
            }}
          >
            Start creating now
          </Button>
        </div>
      </BaseDialog>
    </>
  );
});
