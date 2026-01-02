import { LipSync } from "../Editor/lipsync";
import * as THREE from "three";
import { GetCdnOrigin } from "~/api/GetCdnOrigin";
import Ijson from "~/interfaces/Ijson";
import { StorytellerApiHostStore } from "@storyteller/api";

interface AudioDataInterface {
  audioContext: AudioContext;
  audioBuffer: AudioBuffer;
}

class AudioData implements AudioDataInterface {
  audioContext: AudioContext;
  audioBuffer: AudioBuffer;
  source: AudioBufferSourceNode | undefined;

  constructor(audioContext: AudioContext, audioBuffer: AudioBuffer) {
    this.audioContext = audioContext;
    this.audioBuffer = audioBuffer;
  }
}

class BlendShapeHelper {
  ah: number;
  ee: number;
  oh: number;
  constructor(ah: number, ee: number, oh: number) {
    this.ah = ah;
    this.ee = ee;
    this.oh = oh;
  }
}

export class LipSyncClip implements Ijson {
  version: number;
  media_id: string;
  type: "lipsync";
  volume: number;
  audio_data: AudioData | undefined;
  lipsync: LipSync;
  blendshape_helper: BlendShapeHelper;
  faces: THREE.Mesh[];

  constructor(version: number, media_id: string, volume: number) {
    this.version = version;
    this.media_id = media_id;
    this.type = "lipsync";
    this.volume = volume;
    this.download_audio().then((data) => {
      this.audio_data = data;
    });
    this.blendshape_helper = new BlendShapeHelper(0, 0, 0);
    // we might need 3 of these one for each character ...
    this.lipsync = new LipSync();
    this.faces = [];
  }

  // lip sync will be generated through TTS
  async get_media_url() {
    //This is for prod when we have the proper info on the url.
    const apiSchemeAndHost = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
    const url = `${apiSchemeAndHost}/v1/media_files/file/${this.media_id}`;

    console.log(`API BASE URL? ${apiSchemeAndHost}`);
    console.log(`CALLED URL? ${url}`);

    const response = await fetch(url);
    const json = await JSON.parse(await response.text());
    const bucketPath = json["media_file"]["public_bucket_path"];
    const media_api_base_url = GetCdnOrigin();
    //const media_base_url = `${media_api_base_url}/vocodes-public`;
    //const media_url = `${media_base_url}${bucketPath}`;
    const media_url = `${media_api_base_url}${bucketPath}`;
    return media_url;
  }

  async download_audio() {
    const url = await this.get_media_url();
    const audioContext = new AudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return new AudioData(audioContext, audioBuffer);
  }

  async _detect_face(object: THREE.Object3D): Promise<THREE.Mesh> {
    return new Promise((resolve) => {
      object.traverse((c: THREE.Object3D) => {
        if (c instanceof THREE.Mesh) {
          if (c.morphTargetInfluences && c.morphTargetDictionary) {
            let blendShapeIndexE = c.morphTargetDictionary["E"];
            let blendShapeIndexO = c.morphTargetDictionary["O"];
            let blendShapeIndexA = c.morphTargetDictionary["aa"];

            if (blendShapeIndexE === undefined) {
              blendShapeIndexE = c.morphTargetDictionary["お"]; // MMD OH
              blendShapeIndexO = c.morphTargetDictionary["ω"]; // MMD O
              blendShapeIndexA = c.morphTargetDictionary["あ"]; // MMD A
            }

            if (blendShapeIndexE != null) {
              this.blendshape_helper = new BlendShapeHelper(
                blendShapeIndexA,
                blendShapeIndexE,
                blendShapeIndexO,
              );
              this.faces.push(c);
              resolve(c);
            }
          }
        }
      });
    });
  }

  async play(object: THREE.Object3D) {
    if (this.audio_data?.audioBuffer == null) {
      await this.download_audio();
    }
    if (this.lipsync.face == null) {
      this.lipsync = new LipSync(await this._detect_face(object));
      this.lipsync.startLipSyncFromAudioBuffer(this.audio_data?.audioBuffer);
    }
  }

  stop() {
    if (this.lipsync == null) {
      return;
    }
    this.lipsync.destroy();
  }

  setBlends(ah: number, ee: number, oh: number) {
    this.faces.forEach((element: THREE.Mesh) => {
      if (element.morphTargetInfluences) {
        element.morphTargetInfluences[this.blendshape_helper.ee] = ee;
        element.morphTargetInfluences[this.blendshape_helper.ah] = ah;
        element.morphTargetInfluences[this.blendshape_helper.oh] = oh;
      }
    });
  }

  step(
    frame: number,
    offset: number,
    // rendering: boolean
  ) {
    if (this.lipsync == null) {
      return;
    }
    const positions = this.lipsync.update(frame, offset, true);
    if (positions)
      this.setBlends(positions["ee"], positions["ah"], positions["oh"]);
  }

  reset() {
    if (this.lipsync.face != undefined) {
      this.setBlends(0, 0, 0);
    }
    this.lipsync = new LipSync();
  }

  toJSON() {
    return {
      version: this.version,
      media_id: this.media_id,
      type: this.type,
      volume: this.volume,
    };
  }
}
