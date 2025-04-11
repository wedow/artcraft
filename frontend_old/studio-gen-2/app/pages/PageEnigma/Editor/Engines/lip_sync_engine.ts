import { LipSyncClip } from "../../clips/lipsync_clip";

// needs to be apart of the editor window.
export default class LipSyncEngine {
  clips: { [key: string]: LipSyncClip } = {};
  audio_sources: { [key: string]: AudioBufferSourceNode } = {};
  version: number;

  constructor() {
    this.clips = {};
    this.audio_sources = {};
    this.version = 1.0;
  }

  load_object(object_uuid: string, audio_media_id: string) {
    this.clips[object_uuid + audio_media_id] = new LipSyncClip(
      this.version,
      audio_media_id,
      1.0,
    );
  }
}
