import { FilesetResolver, HandLandmarker, HandLandmarkerResult, NormalizedLandmark, PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import * as Kalidokit from "kalidokit";
import { Box3, Box3Helper, Euler, EulerOrder, KeyframeTrack, Object3D, Object3DEventMap, QuaternionKeyframeTrack, SkeletonHelper, Vector3 } from "three";
import { EulerRotation, XYZ } from "vendor/kalidokit/dist";
import { loadImage } from "~/Helpers/ImageHelpers";
import { EditorExpandedI } from "~/pages/PageEnigma/contexts/EngineContext";
import { HandMixamoBonesMap, mixamorigTransformations } from "../../debug";
import { MixamoInterpolationBoneNames, MixamoPoseMap } from "../Mappers/MixamoPoseMapper";

// TODO: Currently the class uses the scene to use as a detachment parent
// Maybe this would cause problems in the future
// Look into an alternative way to detach bone from parent temporarily because reattaching?
export class CharacterPoseHelper {

  editor: EditorExpandedI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filesetResolver: any;
  numHands = 2;
  numPoses = 1;
  runningMode = "IMAGE";

  constructor(editor: EditorExpandedI) {
    this.editor = editor;
    this.filesetResolver = undefined;
  }

  async initResolver() {
    if (this.filesetResolver) {
      return;
    }

    this.filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
  }

  async extractPoseData(url: string): Promise<{ hands: HandLandmarkerResult; pose: PoseLandmarkerResult; }> {
    const frameImage = new Image();
    frameImage.crossOrigin = "anonymous";
    frameImage.src = url;

    // Wait for image to load before extracting pose data
    await loadImage(frameImage);
    console.debug("Loaded image for inference", frameImage, frameImage.height, frameImage.width)

    // Initialize mediapipe for the image
    await this.initResolver(); // Make sure the resolver is loaded

    const handLandmarker = await HandLandmarker.createFromOptions(this.filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
      },
      numHands: this.numHands,
      runningMode: this.runningMode
    })

    const poseLandmarker = await PoseLandmarker.createFromOptions(this.filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: "GPU"
      },
      runningMode: this.runningMode,
      numPoses: this.numPoses
    })

    // Run the detection on image
    const handResults = handLandmarker.detect(frameImage)
    console.debug("Hand results: ", handResults);

    const poseResults = poseLandmarker.detect(frameImage)
    console.debug("Pose results: ", poseResults);

    return { hands: handResults, pose: poseResults };
  }

  rigRotation(boneName: string, rotation: EulerRotation = { x: 0, y: 0, z: 0 }, skeleton: SkeletonHelper) {
    // Find the corresponding bone via bone name and mapping
    const skeletalBoneMap = mixamorigTransformations[boneName];
    const bone = skeleton.bones.find((bone) => bone.name === skeletalBoneMap.name);

    if (!bone) {
      console.error("Bone not found with name: ", skeletalBoneMap.name);
      return;
    }

    const bindingFunc = skeletalBoneMap.func;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const x = rotation.x;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const y = rotation.y;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const z = rotation.z;
    const evalX = eval(bindingFunc.fx);
    const evalY = eval(bindingFunc.fy);
    const evalZ = eval(bindingFunc.fz);

    const order = skeletalBoneMap.order.toUpperCase();
    bone.updateMatrix();
    const euler = new Euler(
      bone.rotation.x + evalX,
      bone.rotation.y + evalY,
      bone.rotation.z + evalZ,
      (order || rotation.rotationOrder?.toUpperCase() || "XYZ") as EulerOrder
    );

    // Apply rotation to bone
    const newQuat = bone.quaternion.clone();
    newQuat.setFromEuler(euler);
    return [skeletalBoneMap.name, newQuat];
  }

  rigPosition(boneName: string, position: XYZ, skeleton: SkeletonHelper) {
    // Find the corresponding bone via bone name and mapping
    const skeletalBoneMap = mixamorigTransformations[boneName];
    const bone = skeleton.bones.find((bone) => bone.name === skeletalBoneMap.name);

    if (!bone) {
      console.error("Bone not found with name: ", skeletalBoneMap.name);
      return;
    }

    return [skeletalBoneMap.name, new Vector3(position.x, position.y * 1.2, -position.z)];
  }

  rigHandRotation(boneName: string, rotation: EulerRotation = { x: 0, y: 0, z: 0 }, skeleton: SkeletonHelper) {
    // Find the corresponding bone via bone name and mapping
    const skeletalBoneName = HandMixamoBonesMap[boneName];
    const bone = skeleton.bones.find((bone) => bone.name === skeletalBoneName);

    if (!bone) {
      console.error("Bone not found with name: ", skeletalBoneName);
      return;
    }

    const order = "XYZ";
    const euler = new Euler(
      bone.rotation.x + rotation.x,
      bone.rotation.y + rotation.y,
      bone.rotation.z + rotation.z,
      order
    );

    // Apply rotation to bone
    const newQuat = bone.quaternion.clone();
    newQuat.setFromEuler(euler);
    return [skeletalBoneName, newQuat];
  }

  getHandedLandmarks(handLandmarks: HandLandmarkerResult) {
    if (handLandmarks.handedness.length < 2) {
      console.error("Not enough hands detected");
      return undefined;
    }

    // TODO: Use handedness score value to sort by confidence
    // For now assume the top confidence is first result in handedness 
    const topHandedness = handLandmarks.handedness[0][0];

    let leftHandIndex = 0, rightHandIndex = 1;
    if (topHandedness.categoryName === "Right") {
      rightHandIndex = topHandedness.index;
      leftHandIndex = 1 - rightHandIndex;
    } else {
      leftHandIndex = topHandedness.index;
      rightHandIndex = 1 - leftHandIndex;
    }

    return {
      leftHand: handLandmarks.landmarks[leftHandIndex],
      rightHand: handLandmarks.landmarks[rightHandIndex]
    }
  }


  inflatePoseDataToTracks(character: Object3D<Object3DEventMap>, poseData: { hands: HandLandmarkerResult, pose: PoseLandmarkerResult }) {
    const kkitPoseData = Kalidokit.Pose.solve(poseData.pose.worldLandmarks[0], poseData.pose.landmarks[0], {
      runtime: "mediapipe"
    })!;

    const handLandmarks = this.getHandedLandmarks(poseData.hands);
    if (!handLandmarks) {
      console.error("Hand landmarks not found");
    }

    const skeleton = new SkeletonHelper(character);

    const tracks: KeyframeTrack[] = [];
    this.compilePoseData(tracks, skeleton, kkitPoseData);

    if (handLandmarks) {
      this.compileHandData(tracks, handLandmarks, skeleton, kkitPoseData);
    }

    return tracks;
  }

  compileRotation(tracks: Array<KeyframeTrack>, boneName: string, rotation: EulerRotation = { x: 0, y: 0, z: 0 }, skeleton: SkeletonHelper) {
    const mappedRotation = this.rigRotation(boneName, rotation, skeleton);
    if (!mappedRotation) {
      console.error("Bone not found for rotation: ", boneName);
      return;
    }

    const [bone, quaternion] = mappedRotation;
    const track = new QuaternionKeyframeTrack(`${bone}.quaternion`, [0], [quaternion.x, quaternion.y, quaternion.z, quaternion.w]);
    tracks.push(track);
  }

  compileHandRotation(tracks: Array<KeyframeTrack>, boneName: string, rotation: EulerRotation = { x: 0, y: 0, z: 0 }, skeleton: SkeletonHelper) {
    const mappedRotation = this.rigHandRotation(boneName, rotation, skeleton);
    if (!mappedRotation) {
      console.error("Bone not found for rotation: ", boneName);
      return;
    }

    const [bone, quaternion] = mappedRotation;
    const track = new QuaternionKeyframeTrack(`${bone}.quaternion`, [0], [quaternion.x, quaternion.y, quaternion.z, quaternion.w]);
    tracks.push(track);
  }

  compilePoseData(tracks: KeyframeTrack[], skeleton: SkeletonHelper, kkitPoseData: Kalidokit.TPose) {
    this.compileRotation(tracks, "Hips", {
      x: kkitPoseData.Hips.rotation!.x,
      y: kkitPoseData.Hips.rotation!.y,
      z: kkitPoseData.Hips.rotation!.z,
    }, skeleton);

    // Let the rotation happen where the object already is.
    // To change this behaviour, uncomment this code to move the hip too (it's the origin)
    // this.rigPosition("Hips", {
    //   x: kkitPoseData.Hips.position!.x,
    //   y: kkitPoseData.Hips.position!.y,
    //   z: kkitPoseData.Hips.position!.z,
    // }, skeleton);

    this.compileRotation(tracks, "Spine", kkitPoseData.Spine, skeleton);

    this.compileRotation(tracks, "RightUpperArm", kkitPoseData.RightUpperArm, skeleton);
    this.compileRotation(tracks, "RightLowerArm", kkitPoseData.RightLowerArm, skeleton);
    this.compileRotation(tracks, "LeftUpperArm", kkitPoseData.LeftUpperArm, skeleton);
    this.compileRotation(tracks, "LeftLowerArm", kkitPoseData.LeftLowerArm, skeleton);

    this.compileRotation(tracks, "RightUpperLeg", kkitPoseData.RightUpperLeg, skeleton);
    this.compileRotation(tracks, "RightLowerLeg", kkitPoseData.RightLowerLeg, skeleton);
    this.compileRotation(tracks, "LeftUpperLeg", kkitPoseData.LeftUpperLeg, skeleton);
    this.compileRotation(tracks, "LeftLowerLeg", kkitPoseData.LeftLowerLeg, skeleton);
  }

  compileHandData(tracks: KeyframeTrack[], handLandmarks: { leftHand: NormalizedLandmark[], rightHand: NormalizedLandmark[] }, skeleton: SkeletonHelper, kkitPoseData: Kalidokit.TPose) {
    const kkitLeftHandData = Kalidokit.Hand.solve(handLandmarks.leftHand, "Left");
    const kkitRightHandData = Kalidokit.Hand.solve(handLandmarks.rightHand, "Right");

    console.debug("Left hand data: ", kkitLeftHandData);
    console.debug("Right hand data: ", kkitRightHandData);

    if (!kkitLeftHandData || !kkitRightHandData) {
      console.error("One of more hand data not found");
      return;
    }

    // Rig the hands
    // Left hand
    this.compileHandRotation(tracks, "LeftWrist", {
      x: kkitPoseData.LeftHand!.x,
      y: kkitPoseData.LeftHand!.y,
      z: kkitPoseData.LeftHand!.z,
    }, skeleton);
    // Left thumb
    this.compileHandRotation(tracks, "LeftThumbProximal", kkitLeftHandData?.LeftThumbProximal, skeleton);
    this.compileHandRotation(tracks, "LeftThumbIntermediate", kkitLeftHandData?.LeftThumbIntermediate, skeleton);
    this.compileHandRotation(tracks, "LeftThumbDistal", kkitLeftHandData?.LeftThumbDistal, skeleton);
    // Left index
    this.compileHandRotation(tracks, "LeftIndexProximal", kkitLeftHandData?.LeftIndexProximal, skeleton);
    this.compileHandRotation(tracks, "LeftIndexIntermediate", kkitLeftHandData?.LeftIndexIntermediate, skeleton);
    this.compileHandRotation(tracks, "LeftIndexDistal", kkitLeftHandData?.LeftIndexDistal, skeleton);
    // Left middle
    this.compileHandRotation(tracks, "LeftMiddleProximal", kkitLeftHandData?.LeftMiddleProximal, skeleton);
    this.compileHandRotation(tracks, "LeftMiddleIntermediate", kkitLeftHandData?.LeftMiddleIntermediate, skeleton);
    this.compileHandRotation(tracks, "LeftMiddleDistal", kkitLeftHandData?.LeftMiddleDistal, skeleton);
    // Left ring
    this.compileHandRotation(tracks, "LeftRingProximal", kkitLeftHandData?.LeftRingProximal, skeleton);
    this.compileHandRotation(tracks, "LeftRingIntermediate", kkitLeftHandData?.LeftRingIntermediate, skeleton);
    this.compileHandRotation(tracks, "LeftRingDistal", kkitLeftHandData?.LeftRingDistal, skeleton);
    // Left little/pinky
    this.compileHandRotation(tracks, "LeftLittleProximal", kkitLeftHandData?.LeftLittleProximal, skeleton);
    this.compileHandRotation(tracks, "LeftLittleIntermediate", kkitLeftHandData?.LeftLittleIntermediate, skeleton);
    this.compileHandRotation(tracks, "LeftLittleDistal", kkitLeftHandData?.LeftLittleDistal, skeleton);


    // Right hand
    this.compileHandRotation(tracks, "RightWrist", {
      x: kkitPoseData.RightHand!.x,
      y: kkitPoseData.RightHand!.y,
      z: kkitPoseData.RightHand!.z,
    }, skeleton);
    // Right thumb
    this.compileHandRotation(tracks, "RightThumbProximal", kkitRightHandData?.RightThumbProximal, skeleton);
    this.compileHandRotation(tracks, "RightThumbIntermediate", kkitRightHandData?.RightThumbIntermediate, skeleton);
    this.compileHandRotation(tracks, "RightThumbDistal", kkitRightHandData?.RightThumbDistal, skeleton);
    // Right index
    this.compileHandRotation(tracks, "RightIndexProximal", kkitRightHandData?.RightIndexProximal, skeleton);
    this.compileHandRotation(tracks, "RightIndexIntermediate", kkitRightHandData?.RightIndexIntermediate, skeleton);
    this.compileHandRotation(tracks, "RightIndexDistal", kkitRightHandData?.RightIndexDistal, skeleton);
    // Right middle
    this.compileHandRotation(tracks, "RightMiddleProximal", kkitRightHandData?.RightMiddleProximal, skeleton);
    this.compileHandRotation(tracks, "RightMiddleIntermediate", kkitRightHandData?.RightMiddleIntermediate, skeleton);
    this.compileHandRotation(tracks, "RightMiddleDistal", kkitRightHandData?.RightMiddleDistal, skeleton);
    // Right ring
    this.compileHandRotation(tracks, "RightRingProximal", kkitRightHandData?.RightRingProximal, skeleton);
    this.compileHandRotation(tracks, "RightRingIntermediate", kkitRightHandData?.RightRingIntermediate, skeleton);
    this.compileHandRotation(tracks, "RightRingDistal", kkitRightHandData?.RightRingDistal, skeleton);
    // Right little/pinky
    this.compileHandRotation(tracks, "RightLittleProximal", kkitRightHandData?.RightLittleProximal, skeleton);
    this.compileHandRotation(tracks, "RightLittleIntermediate", kkitRightHandData?.RightLittleIntermediate, skeleton);
    this.compileHandRotation(tracks, "RightLittleDistal", kkitRightHandData?.RightLittleDistal, skeleton);
  }

}
