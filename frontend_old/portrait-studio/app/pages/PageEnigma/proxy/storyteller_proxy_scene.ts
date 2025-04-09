import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  StoryTellerProxy3DObject,
  ObjectJSON,
} from "./storyteller_proxy_3d_object";
import Scene from "../Editor/scene";

interface LookUpDictionary {
  [key: string]: StoryTellerProxy3DObject;
}

type OOIType = {
  "RightShoulder": THREE.Object3D;
  "RightArm": THREE.Object3D;
  "RightForeArm": THREE.Object3D;
  "RightHand": THREE.Object3D;
  "LeftShoulder": THREE.Object3D;
  "LeftArm": THREE.Object3D;
  "LeftForeArm": THREE.Object3D;
  "LeftHand": THREE.Object3D;
  "LeftLeg": THREE.Object3D;
  "LeftFoot": THREE.Object3D;
  "LeftUpLeg": THREE.Object3D;
  "RightLeg": THREE.Object3D;
  "RightFoot": THREE.Object3D;
  "RightUpLeg": THREE.Object3D;
  "Neck": THREE.Object3D;
};


export class StoryTellerProxyScene {
  sceneItemProxy: StoryTellerProxy3DObject[];
  scene: Scene;
  glbLoader: GLTFLoader;

  lookUpDictionary: LookUpDictionary;
  version: number;

  constructor(version: number, scene: Scene) {
    this.version = version;
    this.scene = scene;
    this.glbLoader = new GLTFLoader();
    this.lookUpDictionary = {};
    this.sceneItemProxy = [];
  }

  convertBonesToRotationDict(bonesDict: OOIType) {
    const rotationsDict = {};
  
    // Iterate over the bone dictionary
    for (const bonePlace in bonesDict) {
      const bone = bonesDict[bonePlace];
  
      if (bone) {
        // Get the rotation of the bone and store it in the new dict
        rotationsDict[bonePlace] = bone.rotation;
      }
    }
  
    return rotationsDict;
  }

  async getChildren(child: THREE.Object3D) {
    if (this.lookUpDictionary[child.uuid] == null) {
      this.lookUpDictionary[child.uuid] = new StoryTellerProxy3DObject(
        this.version,
        child.userData["media_id"],
      );
    }

    const proxyObject3D: StoryTellerProxy3DObject =
      this.lookUpDictionary[child.uuid];
    proxyObject3D.position.copy(child.position);
    proxyObject3D.rotation.copy(child.rotation);
    proxyObject3D.scale.copy(child.scale);
    proxyObject3D.object_user_data_name = child.userData.name;
    proxyObject3D.object_name = child.name;
    proxyObject3D.object_uuid = child.uuid;
    proxyObject3D.color = child.userData["color"];
    proxyObject3D.metalness = child.userData["metalness"];
    proxyObject3D.shininess = child.userData["shininess"];
    proxyObject3D.specular = child.userData["specular"];
    proxyObject3D.locked = child.userData["locked"];
    proxyObject3D.visible = child.visible;
    proxyObject3D.bones = this.convertBonesToRotationDict(child.userData["Controls"]);
    if (child.userData["media_file_type"] !== undefined) {
      proxyObject3D.media_file_type = child.userData["media_file_type"];
    }
    const json_data = await proxyObject3D.toJSON();
    return json_data;
  }

  public async saveToSceneOlder(): Promise<any> {
    const results: ObjectJSON[] = [];
    if (this.scene.scene != null) {
      for (const child of this.scene.scene.children) {
        if (child.userData["media_id"] != undefined) {
          if (this.lookUpDictionary[child.uuid] == null) {
            this.lookUpDictionary[child.uuid] = new StoryTellerProxy3DObject(
              this.version,
              child.userData["media_id"],
            );
          }
          const proxyObject3D: StoryTellerProxy3DObject =
            this.lookUpDictionary[child.uuid];
          proxyObject3D.position.copy(child.position);
          proxyObject3D.rotation.copy(child.rotation);
          proxyObject3D.scale.copy(child.scale);
          proxyObject3D.object_user_data_name = child.userData.name;
          proxyObject3D.object_name = child.name;
          proxyObject3D.object_uuid = child.uuid;
          proxyObject3D.color = child.userData["color"];
          proxyObject3D.metalness = child.userData["metalness"];
          proxyObject3D.shininess = child.userData["shininess"];
          proxyObject3D.specular = child.userData["specular"];
          proxyObject3D.locked = child.userData["locked"];
          const json_data = await proxyObject3D.toJSON();
          results.push(json_data);
        }
      }
    } else {
      console.log("Scene doesn't exist needs to be assigned");
    }
    console.log(results);
    return results;
  }

  public async saveToScene(version: number): Promise<any> {
    this.version = version;
    console.log("Saving with version:", this.version);
    const results: ObjectJSON[] = [];
    if (this.scene.scene != null) {
      for (const pchild of this.scene.scene.children) {
        if (this.version >= 1.0) {
          if (pchild.userData["media_id"] != undefined) {
            results.push(await this.getChildren(pchild));
          }
        } else {
          console.log("Saving older.");
          return this.saveToSceneOlder();
        }
      }
    } else {
      console.log("Scene doesn't exist needs to be assigned");
    }
    return results;
  }

  public async loadFromSceneJson(
    scene_json: ObjectJSON[],
    skybox_media_id: string,
    version: number,
  ) {
    console.log(scene_json);
    if (scene_json != null && this.scene != null) {
      while (this.scene.scene.children.length > 0) {
        this.scene.scene.remove(this.scene.scene.children[0]);
      }
      for (const json_object of scene_json) {
        const token: string = json_object.media_file_token;
        let obj;
        switch (token) {
          case "Parim": {
            const newScene = await this.scene.instantiate(
              json_object.object_name,
            );
            const prim_uuid = newScene.uuid;
            obj = this.scene.get_object_by_uuid(prim_uuid);
            break;
          }
          case "DirectionalLight": {
            obj = this.scene._create_base_lighting();
            break;
          }
          default: {
            if (token.includes("m_")) {
              obj = await this.scene.loadObject(
                token,
                json_object.object_name,
                true,
                new THREE.Vector3(-0.5, 1.5, 0),
                version,
              );
            } else if (token.includes("Point::")) {
              const keyframe_uuid = token.replace("Point::", "");
              obj = this.scene.createPoint(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                keyframe_uuid,
              );
            } else if (token.includes("Image::")) {
              const prim_uuid = (await this.scene.instantiate(token)).uuid;
              obj = this.scene.get_object_by_uuid(prim_uuid);

              if (obj) {
                obj.name = json_object.object_name;
                obj.userData["name"] = json_object.object_name;
              }
            }
            break;
          }
        }
        if (obj) {
          obj.position.copy(json_object.position);
          obj.rotation.copy(
            new THREE.Euler(
              json_object.rotation.x,
              json_object.rotation.y,
              json_object.rotation.z,
            ),
          );
          obj.scale.copy(json_object.scale);
          obj.name = json_object.object_name;
          obj.userData.name = json_object.object_user_data_name;
          obj.uuid = json_object.object_uuid;
          obj.userData["media_id"] = json_object.media_file_token;
          obj.userData["locked"] = json_object.locked;
          obj.userData["color"] = json_object.color;
          obj.userData["metalness"] = json_object.metalness;
          obj.userData["shininess"] = json_object.shininess;
          obj.userData["specular"] = json_object.specular;
          obj.userData["media_file_type"] = json_object.media_file_type;

          for (const boneName in json_object.bones) {
            if(obj.userData["Controls"][boneName] !== undefined && json_object.bones[boneName] !== undefined){
              obj.userData["Controls"][boneName].rotation.copy(json_object.bones[boneName]);
            }
          }

          if (json_object.visible !== undefined) {
            this.scene.setVisible(obj.uuid, json_object.visible);
          }
          this.scene.setColor(obj.uuid, json_object.color);
        }
      }
      this.scene._createGrid();
      this.scene.updateSkybox(skybox_media_id);
    }
  }
}
