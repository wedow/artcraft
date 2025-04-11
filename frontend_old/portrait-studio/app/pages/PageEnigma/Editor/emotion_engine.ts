import { EmotionClip } from "../datastructures/clips/emotion_clip";

class EmotionEngine {
  clips: { [key: string]: EmotionClip } = {};
  version: number;

  constructor(version: number) {
    this.clips = {};
    this.version = version;
  }

  // loads clips into the engine to cache
  loadClip(object_uuid: string, csv_media_id: string) {
    if (this.clips[object_uuid + csv_media_id] != null) {
      return;
    }
    this.clips[object_uuid + csv_media_id] = new EmotionClip(
      this.version,
      csv_media_id,
    );
  }
}

export default EmotionEngine;
