import { AnimationClip } from "../../clips/animation_clip";

export class AnimationEngine {
  clips: { [key: string]: AnimationClip } = {};
  version: number;

  constructor(version: number) {
    this.clips = {};
    this.version = version;
  }

  load_object(object_uuid: string, media_id: string, clip_name: string) {
    console.debug("load_object", object_uuid, media_id, clip_name);
    this.clips[object_uuid + media_id] = new AnimationClip(
      this.version,
      media_id,
      "glb",
      object_uuid,
      1.0,
      1.0,
      clip_name,
      0.0,
      0.0,
    );
    //this.clips[object_uuid + media_id]._load_animation();
  }
}
