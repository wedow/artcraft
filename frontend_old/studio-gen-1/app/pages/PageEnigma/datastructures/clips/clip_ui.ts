// Clip offsets represent the state of the clip on the timeline as well as what type of clip it is.
// it is created from a media id.
import { MediaFileType } from "~/pages/PageEnigma/enums";
import { ClipGroup, ClipType } from "~/enums";

export class ClipUI {
  version: number;
  type: ClipType;
  group: ClipGroup;
  name: string;
  media_id: string;
  object_uuid: string;
  object_name: string;
  offset: number; // in frames
  length: number; // in frames
  should_play: boolean;
  clip_uuid: string;
  keyframe_offset: number;
  media_file_type: MediaFileType;

  constructor(
    version: number,
    type: ClipType,
    group: ClipGroup,
    name: string,
    media_id: string,
    clip_uuid: string,
    object_uuid: string,
    object_name: string,
    offset: number,
    length: number,
    keyframe_offset: number = 0,
    media_file_type: MediaFileType,
  ) {
    this.version = version;
    this.group = group; // Only needed for UI

    this.clip_uuid = clip_uuid;

    this.name = name; // UI
    this.type = type; // UI and Animation / Audio / Lipsync /  : Engine

    this.object_uuid = object_uuid; // Animation / Audio / Lipsync /  : Engine
    this.object_name = object_name;
    this.media_id = media_id; //  Animation / Audio / Lipsync /  : Engine
    this.offset = offset;
    this.length = length;
    this.should_play = true;
    this.keyframe_offset = keyframe_offset;
    this.media_file_type = media_file_type;
  }

  toJSON(): any {
    return {
      version: this.version,
      group: this.group,
      name: this.name,
      type: this.type,
      clip_uuid: this.clip_uuid,
      object_uuid: this.object_uuid,
      object_name: this.object_name,
      media_id: this.media_id,
      start_offset: this.offset,
      ending_offset: this.length,
      keyframe_offset: this.keyframe_offset,
      media_file_type: this.media_file_type,
    };
  }
}
