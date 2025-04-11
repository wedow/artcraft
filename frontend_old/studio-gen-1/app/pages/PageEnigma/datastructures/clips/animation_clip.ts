import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  FBXLoader,
  MMDAnimationHelper,
  MMDAnimationHelperMixer,
} from "three/examples/jsm/Addons.js";
import { MMDLoader } from "three/addons/loaders/MMDLoader.js";

import { MoveAIResult, Retarget } from "../../Editor/retargeting";
import environmentVariables from "~/Classes/EnvironmentVariables";

export class AnimationClip {
  version: number;
  media_id: string; // comes from the server
  object_uuid: string;
  type: "animation";
  location: "glb" | "remote";
  speed: number;
  length: number;
  clip_name: string;
  mixer: THREE.AnimationMixer | undefined;
  animation_clip: THREE.AnimationClip | undefined;
  clip_action: THREE.AnimationAction | undefined;
  special_properties: MoveAIResult[];
  retargeted: boolean;
  last_frame: number;

  private isMMD: boolean = false;
  private obj: MMDAnimationHelperMixer | undefined;
  private helper: MMDAnimationHelper | undefined;
  private mmd_anim_clip: THREE.AnimationClip | undefined;
  private pose: Object | undefined;
  private processingClip: boolean = false;
  private mmd_url: string = "";

  constructor(
    version: number,
    media_id: string,
    location: "glb" | "remote",
    object_uuid: string,
    speed: number,
    length: number,
    clip_name: string,
  ) {
    this.version = version;
    this.media_id = media_id;
    this.type = "animation";
    this.object_uuid = object_uuid;
    this.location = location;
    this.speed = speed;
    this.length = length;
    this.clip_name = clip_name;
    this.animation_clip;
    this.mixer;
    this.clip_action;
    this.special_properties = [];
    this.retargeted = false;
    this.last_frame = 0;
  }

  async get_media_url() {
    //This is for prod when we have the proper info on the url.
    const api_base_url = environmentVariables.values.BASE_API;
    const url = `${api_base_url}/v1/media_files/file/${this.media_id}`;

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

  _load_animation(): Promise<THREE.AnimationClip> {
    // Return the promise chain starting from `this.get_media_url()`
    return this.get_media_url().then((url) => {
      // Return a new Promise that resolves with the animation clip
      return new Promise((resolve) => {
        if (url.includes(".glb")) {
          const glbLoader = new GLTFLoader();

          glbLoader.load(url, (gltf) => {
            // Assuming the animation is the first one in the animations array
            const animationClip = gltf.animations[0];
            resolve(animationClip);
          });
        } else if (url.includes(".fbx")) {
          const fbxLoader = new FBXLoader();
          fbxLoader.load(url, (fbx) => {
            const animationClip = fbx.animations[0];
            this.retargeted = true;
            animationClip.tracks.forEach((track) => {
              const retarget = new Retarget();
              const retarget_value = retarget.retarget(track.name);
              track.name = retarget_value.bone;
              console.log(track);
              if (retarget_value.is_special) {
                this.special_properties.push(retarget_value);
              }
            });
            resolve(animationClip);
          });
        } else if (url.includes(".vmd")) {
          console.log("VMD Loader");
          const root = this.mixer?.getRoot();
          this.isMMD = true;
          if (root) {
            const mmdLoader = new MMDLoader();
            this.mmd_url = url;
            mmdLoader.loadAnimation(url, root as THREE.SkinnedMesh, (mmd) => {
              mmd.name = this.mmd_url;
              resolve(mmd as THREE.AnimationClip);
            });
            console.log("Loaded");
          }
          console.log("Dont");
        }
      });
    });
  }

  _create_mixer(object: THREE.Object3D) {
    this.mixer = new THREE.AnimationMixer(object);
    return this.mixer;
  }

  async _get_clip() {
    if (this.animation_clip == null && this.mixer !== null) {
      console.log(this.media_id)
      if(this.media_id === "SelfClip") {
        const rootObject = this.mixer?.getRoot();
        if(rootObject)
          this.animation_clip = (rootObject as THREE.Object3D<THREE.Object3DEventMap>).animations[0];
      } else {
        this.animation_clip = await this._load_animation();
      }
    }
    return this.animation_clip;
  }

  async play(object: THREE.Object3D) {
    if (this.mixer == null) {
      this.mixer = this._create_mixer(object);
      const anim_clip = await this._get_clip();
      if (anim_clip == undefined) {
        return;
      }
      this.clip_action = this.mixer?.clipAction(anim_clip);
      if (this.clip_action && this.isMMD === false) {
        if (this.clip_action?.isRunning() == false) {
          this.clip_action.play();
        }
      }
    }
  }

  update_bones() {
    if (this.retargeted === false) {
      return;
    }
    const rootObject = this.mixer?.getRoot();
    if (rootObject)
      for (
        let index_ = 0;
        index_ <
        (rootObject as THREE.Object3D<THREE.Object3DEventMap>).children.length;
        index_++
      ) {
        const child_holder = (
          rootObject as THREE.Object3D<THREE.Object3DEventMap>
        ).children[index_];
        if (child_holder.type == "Bone") {
          child_holder.traverse(
            (bone: THREE.Object3D<THREE.Object3DEventMap>) => {
              for (
                let index__ = 0;
                index__ < this.special_properties.length;
                index__++
              ) {
                const property = this.special_properties[index__];
                if (property.bone == bone.name + ".quaternion") {
                  const quat_y = THREE.MathUtils.degToRad(property.y);
                  bone.rotateY(quat_y);
                  if (property.only_y == false) {
                    const quat_x = THREE.MathUtils.degToRad(property.x);
                    bone.rotateX(quat_x);
                    const quat_z = THREE.MathUtils.degToRad(property.z);
                    bone.rotateZ(quat_z);
                  } else {
                    if (child_holder.parent) {
                      child_holder.parent.rotation.x =
                        THREE.MathUtils.degToRad(-90);
                    }
                  }

                  if (property.flip) {
                    bone.rotateX(bone.rotation.x * 2 * -1);
                  }
                } else if (property.bone == bone.name + ".position") {
                  bone.position.set(
                    bone.position.x * property.x,
                    bone.position.y * property.y,
                    bone.position.z * property.z,
                  );
                }
              }
            },
          );
        }
      }
  }

  private async load_vpd_wrapped(): Promise<object> {
    return new Promise((resolve) => {
      const poseLoader = new MMDLoader();
      poseLoader.loadVPD("/resources/pose/7.vpd", false, (vpd) => {
        resolve(vpd);
      }); // End of loadVPD call
    }); // End of new Promise
  }

  async animate(deltatime: number) {
    // Sets the frame of the animation mixer.
    this.mixer?.setTime(deltatime);
    // Regtargeting for Move.AI
    this.update_bones();

    // Next
    if (this.isMMD && this.mixer) {
      if (this.obj === undefined) {
        // Sets the ik helper and object for IK and animation.
        this.helper = (this.mixer.getRoot() as THREE.Object3D).parent?.userData[
          "helper"
        ];
      }

      this.obj = this.helper?.objects.get(
        this.mixer?.getRoot() as THREE.SkinnedMesh,
      );

      const mesh = this.mixer?.getRoot() as THREE.SkinnedMesh;

      if(this.helper){
        this.helper._restoreBones(mesh); // Privateish js function for resetting bones.
        this.obj?.mixer?.setTime(deltatime); // Sets the time.
        this.helper._saveBones( mesh ); // Saves the bones location for restoration later.

        mesh.updateMatrixWorld( true ); // Updates mesh.
        this.obj?.ikSolver.update(); // Updates IK Solver.
        this.obj?.grantSolver.update(); // Updates Grant which moves the bones.
      }
      
      // Changing of animation.
      if (
        this.obj &&
        this.helper &&
        this.processingClip === false &&
        this.obj.mixer &&
        this.mixer._actions[0]._clip.name !==
          this.obj.mixer._actions[0]._clip.name &&
        this.mixer !== undefined
      ) {
        // On animation change.
        this.processingClip = true;

        const helper_mmd = this.helper.objects.get(mesh);
        if (helper_mmd?.mixer !== undefined) {
          const clips = helper_mmd.mixer._actions;
          clips.forEach((clip) => {
            this.helper?.objects.delete(clip._clip);
          });
        }

        this.helper.remove(mesh);
        mesh.pose();

        const loader = new MMDLoader();
        loader.loadAnimation(this.mmd_url, mesh, (mmd) => {
          mmd.name = this.mmd_url;
          this.helper?.add(mesh, {
            animation: mmd,
            physics: false,
          });
          this.processingClip = false;
          if (helper_mmd?.mixer !== undefined) {
            const clips = helper_mmd.mixer._actions;
            clips.forEach((clip) => {
              this.helper?.objects.delete(clip._clip);
            });
          }
          this.obj.mixer = this.mixer;
        });
      }
    }
  }

  async step(deltatime: number, isPlaying: boolean, frame: number) {
    if (this.mixer == null) {
      return;
    }
    if (this.retargeted) {
      if (isPlaying || Math.floor(frame) != this.last_frame) {
        if (Math.floor(frame) != 0) {
          await this.animate(deltatime);
        }
      }
    } else {
      await this.animate(deltatime);
    }
    this.last_frame = frame;
  }

  stop() {
    this.mixer?.setTime(0);
  }

  toJSON() {
    return {
      version: this.version,
      media_id: this.media_id,
      object_uuid: this.object_uuid,
      type: this.type,
      speed: this.speed,
      length: this.length,
      clip_name: this.clip_name,
    };
  }
}
