import { TransformClip } from "../../clips/transform_clip";
import * as THREE from "three";

class TransformEngine {
  clips: { [key: string]: TransformClip } = {};
  version: number;

  constructor(version: number) {
    this.version = version;
    this.clips = {};
  }

  loadObject(object_uuid: string, clip_length: number = 2) {
    this.clips[object_uuid] = new TransformClip(
      this.version,
      object_uuid,
      clip_length,
      object_uuid,
    ); // replace the last object_uuid with the media ID when its ready.
    return this.clips[object_uuid];
  }

  addFrame(
    object_uuid: string,
    clip_length: number = 2,
    position: THREE.Vector3,
    rotation: THREE.Vector3,
    scale: THREE.Vector3,
    offset: number,
    keyframe_uuid: string,
  ): boolean {
    if (this.clips[object_uuid] == null) {
      this.clips[object_uuid] = new TransformClip(
        this.version,
        object_uuid,
        clip_length,
      );
      this.clips[object_uuid].add_frame(
        position,
        rotation,
        scale,
        offset,
        keyframe_uuid,
      );
      return false;
    }
    this.clips[object_uuid].add_frame(
      position,
      rotation,
      scale,
      offset,
      keyframe_uuid,
    );
    return true;
  }
}

export default TransformEngine;
