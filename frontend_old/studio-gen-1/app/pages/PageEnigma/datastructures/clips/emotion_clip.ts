import * as THREE from "three";

import environmentVariables from "~/Classes/EnvironmentVariables";
interface CsvJson {
  [key: string]: string[];
}

export class EmotionClip {
  version: number;
  media_id: string;
  type: "expression";
  emotion_json: any;
  faces: THREE.Mesh[];

  constructor(version: number, media_id: string) {
    this.version = version;
    this.media_id = media_id;
    this.type = "expression";
    this.faces = [];
    this.download_csv().then((data) => {
      this.emotion_json = data;
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
    //const media_api_base_url = environmentVariables.values.GOOGLE_API;
    const media_api_base_url = 'https://cdn-2.fakeyou.com';
    //const media_base_url = `${media_api_base_url}/vocodes-public`;
    //const media_url = `${media_base_url}${bucketPath}`;
    const media_url = `${media_api_base_url}${bucketPath}`;
    return media_url;
  }

  async download_json() {
    const url = await this.get_media_url();
    const response = await fetch(url);
    return await response.json();
  }

  async download_csv(): Promise<CsvJson> {
    const url = await this.get_media_url();
    const response = await fetch(url);
    const csvText = await response.text();

    // Parsing the CSV text
    const rows = csvText.trim().split("\n");
    const header = rows[0].split(",");
    const jsonData: CsvJson = {};

    header.forEach((key) => (jsonData[key] = []));

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(",");
      values.forEach((value, index) => {
        jsonData[header[index]].push(value);
      });
    }

    return jsonData;
  }

  async _detect_face(object: THREE.Object3D): Promise<THREE.Mesh> {
    this.faces = [];
    return new Promise((resolve) => {
      object.traverse((c: THREE.Object3D) => {
        if (c instanceof THREE.Mesh) {
          if (c.morphTargetInfluences && c.morphTargetDictionary) {
            const blendShapeIndexE = c.morphTargetDictionary["jawOpen"];
            if (blendShapeIndexE !== undefined) {
              this.faces.push(c);
              resolve(c);
            }
          }
        }
      });
    });
  }

  setBlends(shapes: { [key: string]: number }) {
    this.faces.forEach((element: THREE.Mesh) => {
      if (element.morphTargetInfluences && shapes) {
        Object.keys(shapes).forEach((key) => {
          let index = element.morphTargetDictionary?.[key];
          if (index === undefined) {
            index =
              element.morphTargetDictionary?.[
                key.charAt(0).toLowerCase() + key.slice(1)
              ];
          }
          if (
            typeof index === "number" &&
            element.morphTargetInfluences !== undefined
          ) {
            element.morphTargetInfluences[index] = shapes[key];
          }
        });
      }
    });
  }

  async reset(object: THREE.Object3D) {
    await this._detect_face(object);
    const keys: { [key: string]: number } = {};
    if (this.emotion_json === undefined || this.emotion_json === null) {
      return;
    }
    Object.keys(this.emotion_json).forEach((key) => {
      keys[key] = 0;
    });
    this.setBlends(keys);
  }

  async step(frame: number, object: THREE.Object3D) {
    if (this.faces.length <= 0) {
      await this._detect_face(object);
    }
    if (this.emotion_json === undefined || this.emotion_json === null) {
      return;
    }
    const keys: { [key: string]: number } = {};
    Object.keys(this.emotion_json).forEach((key) => {
      if (Math.floor(frame) > this.emotion_json[key].length) {
        return;
      }
      keys[key] = this.emotion_json[key][Math.floor(frame)];
    });
    this.setBlends(keys);
  }

  toJSON() {
    return {
      version: this.version,
      media_id: this.media_id,
      type: this.type,
    };
  }
}
