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
import { useRef } from "react";
import { EngineType } from "~/KonvaApp";
import { GenerationEngine } from "~/KonvaApp/GenerationEngine";

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
    <div className="fixed grid h-full w-full grid-cols-12 grid-rows-12">
      {childView}
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
    </div>
  );
});
