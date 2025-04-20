import { AnimationClip } from "../clips/animation_clip";
import { AudioClip } from "../clips/audio_clip";
import { ClipUI } from "../clips/clip_ui";
import { EmotionClip } from "../clips/emotion_clip";
import { LipSyncClip } from "../clips/lipsync_clip";
import { TransformClip } from "../clips/transform_clip";
import { CharacterAnimationEngine } from "../Editor/Engines/CharacterAnimationEngine";
import AudioEngine from "../Editor/Engines/audio_engine";
import EmotionEngine from "../Editor/Engines/emotion_engine";
import LipSyncEngine from "../Editor/Engines/lip_sync_engine";
import { TimeLine } from "../Editor/timeline";
import TransformEngine from "../Editor/Engines/transform_engine";
import Ijson from "~/interfaces/Ijson";
import { ClipGroup, ClipType } from "~/enums";

export class StoryTellerProxyTimeline {
  timeline: TimeLine;
  transform_engine: TransformEngine;
  animation_engine: CharacterAnimationEngine;
  audio_engine: AudioEngine;
  lipsync_engine: LipSyncEngine;
  emotion_engine: EmotionEngine;

  constructor(
    version: number,
    timeline: TimeLine,
    transform_engine: TransformEngine,
    animation_engine: CharacterAnimationEngine,
    audio_engine: AudioEngine,
    lipsync_engine: LipSyncEngine,
    emotion_engine: EmotionEngine,
  ) {
    this.timeline = timeline;
    this.transform_engine = transform_engine;
    this.animation_engine = animation_engine;
    this.audio_engine = audio_engine;
    this.lipsync_engine = lipsync_engine;
    this.emotion_engine = emotion_engine;
  }

  private async getItemsToJson(items: Ijson[]): Promise<unknown[]> {
    const timeline_items_data: unknown[] = [];
    items.forEach((element) => { timeline_items_data.push(element.toJSON()); });

    return timeline_items_data;
  }

  private async getItemsDict(items: {
    [key: string]: Ijson;
  }): Promise<{ [key: string]: unknown }> {
    const timeline_items_data: { [key: string]: unknown } = {};
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        const element = items[key];
        timeline_items_data[key] = element.toJSON();
      }
    }
    return timeline_items_data;
  }

  public async saveToJson(): Promise<unknown> {
    const timeline_json = {
      timeline: await this.getItemsToJson(this.timeline.timeline_items),
      transform: await this.getItemsDict(this.transform_engine.clips),
      animation: this.animation_engine.toJSON(),
      audio: await this.getItemsDict(this.audio_engine.clips),
      lipsync: await this.getItemsDict(this.lipsync_engine.clips),
      emotion: await this.getItemsDict(this.emotion_engine.clips),
    };
    console.log(timeline_json);

    return timeline_json;
  }

  private async loadTimelineClips(timeline_clips: any[]): Promise<any[]> {
    const new_clips = [];
    if (timeline_clips) {
      for (let index = 0; index < timeline_clips.length; index++) {
        const element = timeline_clips[index];
        const clip = new ClipUI(
          element.version,
          element.type,
          element.group,
          element.name,
          element.media_id,
          element.clip_uuid,
          element.object_uuid,
          element.object_name,
          element.start_offset,
          element.ending_offset,
          element.keyframe_offset,
          element.media_file_type,
        );
        new_clips.push(clip);
      }
    }
    return new_clips;
  }

  private async loadTransformClips(items: {
    [key: string]: any;
  }): Promise<{ [key: string]: any }> {
    const timeline_items_data: { [key: string]: any } = {};
    for (const key in items) {
      if (items.hasOwnProperty(key)) {
        const element = items[key];
        timeline_items_data[key] = new TransformClip(
          element.version,
          element.object_uuid,
          element.length,
          element.media_id,
        );
        timeline_items_data[key].keyframes = element.keyframes;
      }
    }
    return timeline_items_data;
  }

  private async loadAudioClips(items: {
    [key: string]: any;
  }): Promise<{ [key: string]: any }> {
    const timeline_items_data: { [key: string]: any } = {};
    for (const key in items) {
      if (items.hasOwnProperty(key)) {
        const element = items[key];
        timeline_items_data[key] = new AudioClip(
          element.version,
          element.media_id,
          element.volume,
        );
      }
    }
    return timeline_items_data;
  }

  private async loadLipsyncClips(items: {
    [key: string]: any;
  }): Promise<{ [key: string]: any }> {
    const timeline_items_data: { [key: string]: any } = {};
    for (const key in items) {
      if (items.hasOwnProperty(key)) {
        const element = items[key];
        timeline_items_data[key] = new LipSyncClip(
          element.version,
          element.media_id,
          element.volume,
        );
      }
    }
    return timeline_items_data;
  }

  private async loadEmotionClips(items: {
    [key: string]: any;
  }): Promise<{ [key: string]: any }> {
    const timeline_items_data: { [key: string]: any } = {};
    for (const key in items) {
      if (items.hasOwnProperty(key)) {
        const element = items[key];
        timeline_items_data[key] = new EmotionClip(
          element.version,
          element.media_id,
        );
      }
    }
    return timeline_items_data;
  }

  public async loadFromJson(timeline: any) {
    this.timeline.timeline_items = await this.loadTimelineClips(
      timeline["timeline"],
    );
    this.transform_engine.clips = await this.loadTransformClips(
      timeline["transform"],
    );
    this.audio_engine.clips = await this.loadAudioClips(timeline["audio"]);
    this.lipsync_engine.clips = await this.loadLipsyncClips(
      timeline["lipsync"],
    );
    this.emotion_engine.clips = await this.loadEmotionClips(
      timeline["emotion"],
    );

    // Add characters and their animations
    const animationClips = this.timeline.timeline_items.filter((clip) => { clip.group === ClipGroup.CHARACTER && clip.type === ClipType.ANIMATION })
    animationClips.forEach((clip) => {
      const characterObject = this.timeline.scene.get_object_by_uuid(clip.object_uuid);

      if (!characterObject) {
        return
      }

      this.animation_engine.addCharacterAnimationMedia(characterObject, clip.media_id, clip);
    });

    this.timeline.updateUI();
  }
}
