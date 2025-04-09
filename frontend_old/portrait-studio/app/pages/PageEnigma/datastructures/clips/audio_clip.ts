import environmentVariables from "~/Classes/EnvironmentVariables";

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

export class AudioClip {
  version: number;
  media_id: string;
  type: "audio";
  volume: number;
  audio_data: AudioData | undefined;

  constructor(version: number, media_id: string, volume: number) {
    this.version = version;
    this.media_id = media_id;
    this.type = "audio";
    this.volume = volume;
    this.download_audio().then((data) => {
      this.audio_data = data;
    });
  }

  async get_media_url() {
    //This is for prod when we have the proper info on the url.
    const api_base_url = environmentVariables.values.BASE_API;
    const url = `${api_base_url}/v1/media_files/file/${this.media_id}`;

    //console.log(`API BASE URL? ${api_base_url}`);
    //console.log(`CALLED URL? ${url}`);
    const response = await fetch(url);
    const json = await JSON.parse(await response.text());
    const bucketPath = json["media_file"]["public_bucket_path"];
    const media_api_base_url = environmentVariables.values.GOOGLE_API;
    const media_base_url = `${media_api_base_url}/vocodes-public`;
    const media_url = `${media_base_url}${bucketPath}`;
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

  toJSON() {
    return {
      version: this.version,
      media_id: this.media_id,
      type: this.type,
      volume: this.volume,
    };
  }
}
