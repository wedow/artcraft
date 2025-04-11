import { deepCopySerializableObjects as deepCopy } from "~/utilities";
import { ClipUI } from "../../clips/clip_ui";
import AudioEngine from "../Engines/audio_engine";
import EmotionEngine from "../Engines/emotion_engine";
import LipSyncEngine from "../Engines/lip_sync_engine";
import { TimeLine } from "../timeline";
import TransformEngine from "../Engines/transform_engine";
import { TimelineStateJson } from "./EditorStateJSON/timeline_state_json";
import { CharacterAnimationEngine } from "../Engines/CharacterAnimationEngine";


export class TimelineState {
  version: number;
  timeline_items: ClipUI[] | undefined;
  transform_engine: TransformEngine | undefined;
  animation_engine: CharacterAnimationEngine | undefined;
  audio_engine: AudioEngine | undefined;
  lipsync_engine: LipSyncEngine | undefined;
  emotion_engine: EmotionEngine | undefined;

  constructor({ editorVersion }: { editorVersion: number; }) {
    this.version = editorVersion;
  }

  public async initializeFromTimeline(timeline: TimeLine): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.timeline_items = deepCopy(timeline.timeline_items);
        this.transform_engine = deepCopy(timeline.transform_engine);
        this.animation_engine = deepCopy(timeline.animation_engine);
        this.audio_engine = deepCopy(timeline.audio_engine);
        this.lipsync_engine = deepCopy(timeline.lipSync_engine);
        this.emotion_engine = deepCopy(timeline.emotion_engine);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
  public async initializeFromTimelineStateJson(
    jsonObject: TimelineStateJson
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(jsonObject);
        //TODO: parse json object back into each engine object
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
  public async toJSON() {
    const result: TimelineStateJson = {
      version: this.version,
      timelineItemsJson: JSON.stringify(this.timeline_items),
      transformJson: JSON.stringify(this.transform_engine),
      animationJson: JSON.stringify(this.animation_engine),
      audioJson: JSON.stringify(this.audio_engine),
      lipsyncJson: JSON.stringify(this.lipsync_engine),
      emotionJson: JSON.stringify(this.emotion_engine),
    };
    return result;
  }
}

