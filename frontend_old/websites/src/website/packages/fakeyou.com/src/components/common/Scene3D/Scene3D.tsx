import React, { useCallback, useEffect, useRef } from "react";
//import IframeResizer from "iframe-resizer-react";
import "./Scene3D.scss";
import { EngineMode } from "./EngineMode";
import { GetEngineUrl, LoadableAsset } from "./GetEngineUrl";

const CHECK_FRAME_URL = "https://engine.fakeyou.com";

// See the following page for Storyteller Engine's query param documentation:
// https://www.notion.so/storytellerai/Studio-Iframe-Query-Params-a748a9929ec3404780c3884e7fb89bdb

interface Scene3DProps {
  // The mode to open the engine in.
  mode: EngineMode;

  // for local dev
  overrideURL?: string, 

  // A polymorphic asset type.
  // See `GetEngineUrl()` for usage.
  asset: LoadableAsset,

  // A skybox to use.
  skybox?: string;

  // Whether the engine should be full screen
  fullScreen?: boolean;

  // CSS classes to apply to the engine
  className?: string;

  // Callback when the scene is first loaded
  // Not always 100% true. Sometimes it prematurely fires.
  onSceneReadyCallback?: () => void;

  // Callback called when the scene is saved.
  // It will receive the argument of the new scene media token.
  onSceneSavedCallback?: (mediaToken: string) => void;
}

export default function Scene3D({
  mode,
  asset,
  skybox,
  fullScreen = false,
  className,
  onSceneReadyCallback,
  onSceneSavedCallback,
  overrideURL,
}: Scene3DProps) {

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const onMessage = useCallback((event: MessageEvent) => {
    console.log("🟢 engine message received", event.data, event, onSceneReadyCallback !== undefined);

    if (!overrideURL && event.origin !== CHECK_FRAME_URL)
      return;

    if (event.data === "studio-ready") {
      console.log("studio-ready message (1)");

      const studio = iframeRef.current?.contentWindow;
      if (!studio) return;

      console.log("studio-ready message (2)");

      if (onSceneReadyCallback !== undefined) { 
        onSceneReadyCallback();
      }

      // NB: Example of how to call the API in the other direction:
      //  studio.postMessage("save-scene", engineBaseUrl);
    } else if (
      typeof event.data === "string"
      && event.data.startsWith("scene-saved:")
    ) {
      const mediaToken = event.data.match(/scene-saved:(.+)/)?.[1];
      console.log("saved scene media token:", mediaToken);

      if (onSceneSavedCallback !== undefined && mediaToken !== undefined) {
        onSceneSavedCallback(mediaToken);
      }

    } else if (event.data === "scene-save-failed") {
      console.error("Failed to save the scene!");
    }
  }, [onSceneReadyCallback, onSceneSavedCallback, overrideURL]);


  useEffect(() => {
    window.addEventListener("message", onMessage, false);
    return () => {
      window.removeEventListener("message", onMessage, false);
    }
  }, [onMessage]);

  let engineUrl = GetEngineUrl({
    mode: mode,
    overrideURL,
    asset: asset,
    skybox: skybox
  });

  return (
    <div
      className={`${
        fullScreen ? "fy-scene-3d-fullscreen" : "fy-scene-3d-default"
      } ${className ? className : ""}`.trim()}
    >
      {/* IframeResizer was causing some glitches passing messages. Need to test more. */}
      {/*<IframeResizer src={engineUrl} width="100%" height="100%" id="" />*/}
      <iframe
        title="Storyteller Engine"
        ref={iframeRef}
        src={engineUrl}
        width="100%"
        height="100%"
      />
    </div>
  );
}
