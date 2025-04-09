import React from "react";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import Scene3D from "components/common/Scene3D/Scene3D";
import { EngineMode } from "components/common/Scene3D/EngineMode";

// Storyteller Engine parameters
// These are documented here:
// https://www.notion.so/storytellerai/Studio-Iframe-Query-Params-a748a9929ec3404780c3884e7fb89bdb
const SKYBOX = "333348"; // Looks good (lighter)
//const SKYBOX = "242433"; // Looks good
//const SKYBOX = "1a1a27"; // Too dark
//const SKYBOX = "3f3f55"; // too light

export interface EngineMediaPanelArgs {
  mediaFile: MediaFile;
}

export function EngineMediaPanel({ mediaFile }: EngineMediaPanelArgs) {
  return (
    <Scene3D
      mode={EngineMode.Viewer}
      skybox={SKYBOX}
      fullScreen={false}
      className="fy-studio-frame"
      asset={mediaFile}
    />
  );
}
