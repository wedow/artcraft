import { AnimationClip } from "../datastructures/clips/animation_clip";

export class AnimationEngine {
  clips: { [key: string]: AnimationClip } = {};
  version: number;

  constructor(version: number) {
    this.clips = {};
    this.version = version;
  }

  load_object(object_uuid: string, media_id: string, clip_name: string) {
    this.clips[object_uuid + media_id] = new AnimationClip(
      this.version,
      media_id,
      "glb",
      object_uuid,
      1.0,
      1.0,
      clip_name,
    );
    //this.clips[object_uuid + media_id]._load_animation();
  }
}
