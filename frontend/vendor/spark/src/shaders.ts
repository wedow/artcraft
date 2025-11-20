import * as THREE from "three";

import splatDefines from "./shaders/splatDefines.glsl?raw";
import splatFragment from "./shaders/splatFragment.glsl?raw";
import splatVertex from "./shaders/splatVertex.glsl?raw";

let shaders: Record<string, string> | null = null;

export function getShaders(): Record<string, string> {
  if (!shaders) {
    // @ts-ignore
    THREE.ShaderChunk.splatDefines = splatDefines;
    shaders = {
      splatVertex,
      splatFragment,
    };
  }
  return shaders;
}
