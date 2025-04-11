import * as THREE from "three";
import Scene from "../../Editor/scene";

export class TransformFrame {
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  scale: THREE.Vector3;
  offset: number;
  keyframe_uuid: string;

  constructor(
    position: THREE.Vector3,
    rotation: THREE.Vector3,
    scale: THREE.Vector3,
    offset: number,
    keyframe_uuid: string,
  ) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.offset = offset;
    this.keyframe_uuid = keyframe_uuid;
  }
}

export class TransformClip {
  version: number;
  media_id: string;
  object_uuid: string;
  type: "transform";
  keyframes: TransformFrame[];
  length: number;

  step_frame: number;
  looping: boolean;

  offset: number;

  constructor(
    version: number,
    object_uuid: string,
    length: number,
    media_id: string = "",
  ) {
    this.version = version;
    this.media_id = media_id;
    this.object_uuid = object_uuid;
    this.type = "transform";

    this.length = length;

    this.keyframes = [];

    this.step_frame = 0;
    this.offset = 0;

    this.looping = false;
  }

  private findNextNumber(location: number) {
    // Sort the transform frames based on their offset in ascending order
    this.keyframes.sort((a, b) => a.offset - b.offset);

    let currentKeyframe: TransformFrame | undefined;
    let nextKeyframe: TransformFrame | undefined;

    this.length =
      this.keyframes[this.keyframes.length - 1].offset + this.offset;

    for (const frame of this.keyframes) {
      if (frame.offset <= location) {
        currentKeyframe = frame;
      } else if (frame.offset > location) {
        nextKeyframe = frame;
        break;
      }
    }

    return { currentKeyframe, nextKeyframe };
  }

  public setOffset(keyframe_uuid: string, keyframe_offset: number) {
    this.keyframes.forEach((item) => {
      if (item.keyframe_uuid === keyframe_uuid) {
        item.offset = keyframe_offset;
        return;
      }
    });
  }

  public setTransform(
    keyframe_uuid: string,
    position: THREE.Vector3,
    rotation: THREE.Vector3,
    scale: THREE.Vector3,
  ) {
    this.keyframes.forEach((item) => {
      if (item.keyframe_uuid === keyframe_uuid) {
        item.position = position;
        item.rotation = rotation;
        item.scale = scale;
        return;
      }
    });
  }

  public removeKeyframe(keyframe_uuid: string) {
    this.keyframes = this.keyframes.filter(
      (item) => item.keyframe_uuid !== keyframe_uuid,
    );
  }

  request_point_location(keyframe_uuid: string, scene: Scene) {
    const point = scene.getPoint(keyframe_uuid);
    if (point == undefined) {console.log("Could not find point."); return;}
    this.keyframes.forEach(keyframe => {
      if(keyframe.keyframe_uuid == keyframe_uuid) {
        keyframe.position = point.position;
        keyframe.rotation = new THREE.Vector3(point.rotation.x, point.rotation.y, point.rotation.z);
        keyframe.scale = point.scale;
      }
    });
    return point;
  }

  step(object: THREE.Object3D, offset: number, frame: number, scene: Scene) {
    this.offset = offset;
    this.step_frame = frame - offset;
    //if (this.step_frame < 0) { this.step_frame = 0; }
    //if (this.step_frame >= this.length) { return; } // Reached max frames.
    if (this.keyframes.length < 1) {
      return;
    } // If there are enough points in the scene.

    // Find the current and next keyframes based on time_frame
    const { currentKeyframe, nextKeyframe } = this.findNextNumber(
      this.step_frame,
    );
    if (nextKeyframe != undefined && currentKeyframe != undefined) {
      const small_step_frame = this.step_frame - currentKeyframe.offset;
      let location =
        small_step_frame / (nextKeyframe.offset - currentKeyframe.offset);
      if (location < 0) {
        location = 0;
      }
      const pos_s = currentKeyframe?.position;
      let pos_e = nextKeyframe?.position;
      if (pos_e === undefined) {
        this.request_point_location(nextKeyframe.keyframe_uuid, scene);
        pos_e = nextKeyframe?.position;
      }
      const points_pos = [
        new THREE.Vector3(pos_s.x, pos_s.y, pos_s.z),
        new THREE.Vector3(pos_e.x, pos_e.y, pos_e.z),
      ];
      const curve_pos = new THREE.CatmullRomCurve3(points_pos);
      const point_pos = curve_pos.getPoint(location);
      object.position.copy(point_pos);

      const rot_s = currentKeyframe?.rotation;
      const rot_e = nextKeyframe?.rotation;
      const quat_s = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.degToRad(rot_s.x),
          THREE.MathUtils.degToRad(rot_s.y),
          THREE.MathUtils.degToRad(rot_s.z),
        ),
      );
      const quat_e = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.degToRad(rot_e.x),
          THREE.MathUtils.degToRad(rot_e.y),
          THREE.MathUtils.degToRad(rot_e.z),
        ),
      );
      const quaternion = new THREE.Quaternion();
      quaternion.slerpQuaternions(quat_s, quat_e, location);
      object.quaternion.copy(quaternion);

      const scale_s = currentKeyframe?.scale;
      const scale_e = nextKeyframe?.scale;
      const points_scale = [
        new THREE.Vector3(scale_s.x, scale_s.y, scale_s.z),
        new THREE.Vector3(scale_e.x, scale_e.y, scale_e.z),
      ];
      const curve_scale = new THREE.CatmullRomCurve3(points_scale);
      const point_scale = curve_scale.getPoint(location);
      object.scale.copy(point_scale);
    }
  }

  reset(object: THREE.Object3D) {
    if (this.keyframes.length > 0) {
      const first_pos = this.keyframes[0].position;
      const first_rot = this.keyframes[0].rotation;
      const first_quat = new THREE.Euler(
        THREE.MathUtils.degToRad(first_rot.x),
        THREE.MathUtils.degToRad(first_rot.y),
        THREE.MathUtils.degToRad(first_rot.z),
      );
      const first_scl = this.keyframes[0].scale;
      object.position.copy(first_pos);
      object.rotation.copy(first_quat);
      object.scale.copy(first_scl);
      this.step_frame = 0;
    }
  }

  add_frame(
    position: THREE.Vector3,
    rotation: THREE.Vector3,
    scale: THREE.Vector3,
    offset: number,
    keyframe_uuid: string,
  ) {
    this.keyframes.push(
      new TransformFrame(position, rotation, scale, offset, keyframe_uuid),
    );
  }

  toJSON(): any {
    return {
      version: this.version,
      media_id: this.media_id,
      object_uuid: this.object_uuid,
      length: this.length,
      type: this.type,
      keyframes: this.keyframes,
    };
  }
}
