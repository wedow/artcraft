import * as THREE from "three";
import { CachedPoseLandmarker } from "../pose/CachedPoseLandmarker";

//import * as Kalidokit from "kalidokit";
import * as Kalidokit from "kalidokit";
import {
  Vector,
  Utils,
  Hand,
  Face,
  Pose,
  HandKeys,
  Side,
  THand,
  TFace,
  TPose,
} from "kalidokit";
//import { Pose } from "kalidokit";
//const Kalidokit = require('kalidokit');

import {
  FilesetResolver,
  PoseLandmarker,
  PoseLandmarkerResult,
  HolisticLandmarker,
  HolisticLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { CharacterPoseHelper } from "./Engines/Helpers/CharacterPoseHelper";
import { loadImageFromAnonymousOriginUrl } from "~/Helpers/ImageHelpers";
const leftHandBones = [
  "LeftRingProximal",
  "LeftRingIntermediate",
  "LeftRingDistal",
  "LeftIndexProximal",
  "LeftIndexIntermediate",
  "LeftIndexDistal",
  "LeftMiddleProximal",
  "LeftMiddleIntermediate",
  "LeftMiddleDistal",
  "LeftThumbProximal",
  "LeftThumbDistal",
  "LeftLittleProximal",
  "LeftLittleIntermediate",
  "LeftLittleDistal",
];
const rightHandBones = [
  "RightRingProximal",
  "RightRingIntermediate",
  "RightRingDistal",
  "RightIndexProximal",
  "RightIndexIntermediate",
  "RightIndexDistal",
  "RightMiddleProximal",
  "RightMiddleIntermediate",
  "RightMiddleDistal",
  "RightThumbProximal",
  "RightThumbDistal",
  "RightLittleProximal",
  "RightLittleIntermediate",
  "RightLittleDistal",
];

export const HandMixamoBonesMap: { [key: string]: string } = {
  LeftRingProximal: "mixamorigLeftHandRing1",
  LeftRingIntermediate: "mixamorigLeftHandRing2",
  LeftRingDistal: "mixamorigLeftHandRing3",
  LeftIndexProximal: "mixamorigLeftHandIndex1",
  LeftIndexIntermediate: "mixamorigLeftHandIndex2",
  LeftIndexDistal: "mixamorigLeftHandIndex3",
  LeftMiddleProximal: "mixamorigLeftHandMiddle1",
  LeftMiddleIntermediate: "mixamorigLeftHandMiddle2",
  LeftMiddleDistal: "mixamorigLeftHandMiddle3",
  LeftThumbProximal: "mixamorigLeftHandThumb1",
  LeftThumbIntermediate: "mixamorigLeftHandThumb2",
  LeftThumbDistal: "mixamorigLeftHandThumb3",
  LeftLittleProximal: "mixamorigLeftHandPinky1",
  LeftLittleIntermediate: "mixamorigLeftHandPinky2",
  LeftLittleDistal: "mixamorigLeftHandPinky3",
  LeftWrist: "mixamorigLeftHand",
  RightRingProximal: "mixamorigRightHandRing1",
  RightRingIntermediate: "mixamorigRightHandRing2",
  RightRingDistal: "mixamorigRightHandRing3",
  RightIndexProximal: "mixamorigRightHandIndex1",
  RightIndexIntermediate: "mixamorigRightHandIndex2",
  RightIndexDistal: "mixamorigRightHandIndex3",
  RightMiddleProximal: "mixamorigRightHandMiddle1",
  RightMiddleIntermediate: "mixamorigRightHandMiddle2",
  RightMiddleDistal: "mixamorigRightHandMiddle3",
  RightThumbProximal: "mixamorigRightHandThumb1",
  RightThumbIntermediate: "mixamorigRightHandThumb2",
  RightThumbDistal: "mixamorigRightHandThumb3",
  RightLittleProximal: "mixamorigRightHandPinky1",
  RightLittleIntermediate: "mixamorigRightHandPinky2",
  RightLittleDistal: "mixamorigRightHandPinky3",
  RightWrist: "mixamorigRightHand",
};

// TODO(bt,2025-01-28): I don't understand this codebase well yet, and I'm trying to apply bone rotations.
// This is a simple set of experiments for me to come up to speed with Threejs, our code, and the theoretical
// task at hand. IF THIS CODE IS PRESENT IN THE FUTURE IT SHOULD BE REMOVED AS IT SERVES NO OTHER PURPOSE.

const DEBUG_ENABLED = true;
const DEBUG_PRINT_ENABLED = true;

type EulerOrder = "XYZ" | "YZX" | "ZXY" | "XZY" | "YXZ" | "ZYX";

type TransformOperation = `-${string}` | string; // Allows "-x", "x", etc.
type TransformOperations = {
  fx: TransformOperation;
  fy: TransformOperation;
  fz: TransformOperation;
};

export const mixamorigTransformations: {
  [key: string]: {
    name: string;
    order: EulerOrder;
    func: TransformOperations;
  }
} = {
  "Hips": {
    "name": "mixamorigHips",
    "order": "XYZ",
    "func": { "fx": "-x", "fy": "y", "fz": "-z" }
  },
  "Neck": {
    "name": "mixamorigNeck",
    "order": "XYZ",
    "func": { "fx": "-x", "fy": "y", "fz": "-z" }
  },
  "Chest": {
    "name": "mixamorigSpine2",
    "order": "XYZ",
    "func": { "fx": "-x", "fy": "y", "fz": "-z" }
  },
  "Spine": {
    "name": "mixamorigSpine",
    "order": "XYZ",
    "func": { "fx": "-x", "fy": "y", "fz": "-z" }
  },
  "RightUpperArm": {
    "name": "mixamorigRightArm",
    "order": "ZXY",
    "func": { "fx": "-z", "fy": "x", "fz": "-y" }
  },
  "RightLowerArm": {
    "name": "mixamorigRightForeArm",
    "order": "ZXY",
    "func": { "fx": "-z", "fy": "x", "fz": "-y" }
  },
  "LeftUpperArm": {
    "name": "mixamorigLeftArm",
    "order": "ZXY",
    "func": { "fx": "z", "fy": "-x", "fz": "-y" }
  },
  "LeftLowerArm": {
    "name": "mixamorigLeftForeArm",
    "order": "ZXY",
    "func": { "fx": "z", "fy": "-x", "fz": "-y" }
  },
  "LeftUpperLeg": {
    "name": "mixamorigLeftUpLeg",
    "order": "XYZ",
    "func": { "fx": "-x", "fy": "y", "fz": "-z" }
  },
  "LeftLowerLeg": {
    "name": "mixamorigLeftLeg",
    "order": "XYZ",
    "func": { "fx": "-x", "fy": "y", "fz": "-z" }
  },
  "RightUpperLeg": {
    "name": "mixamorigRightUpLeg",
    "order": "XYZ",
    "func": { "fx": "-x", "fy": "y", "fz": "-z" }
  },
  "RightLowerLeg": {
    "name": "mixamorigRightLeg",
    "order": "XYZ",
    "func": { "fx": "-x", "fy": "y", "fz": "-z" }
  }
};
// NB: From James Bond image.
const EXAMPLE_POSE: KalidokitPose = {
  RightUpperArm: {
    x: -0.4230379402555594,
    y: 1.7737168782435317,
    z: -1.0277683620346483,
  },
  RightLowerArm: {
    x: -0.3,
    y: 0.9865853333958371,
    z: 0.3779985683628639,
  },
  LeftUpperArm: {
    x: 0.005554997408462992,
    y: -1.4626850489681587,
    z: 1.1226644661733884,
  },
  LeftLowerArm: {
    x: -0.015415961257577574,
    y: -0.3543613298595948,
    z: 0,
  },
  RightHand: {
    x: -0.42668629235907013,
    y: -0.47942290499788864,
    z: 0.5513363407475719,
  },
  LeftHand: {
    x: 0.1791247835953645,
    y: 0.6,
    z: 0.9815028962744002,
  },

  RightUpperLeg: {
    x: 0.48739810481744406,
    y: 0.5335122086099788,
    z: -0.26540331612091095,
    rotationOrder: "XYZ",
  },
  RightLowerLeg: {
    x: -1.987357750417811,
    y: 0,
    z: 0,
    rotationOrder: "XYZ",
  },
  LeftUpperLeg: {
    x: 0.5327440321782165,
    y: 0.40825017329318186,
    z: -0.31162463497702436,
    rotationOrder: "XYZ",
  },
  LeftLowerLeg: {
    x: -1.7621100159383252,
    y: 0,
    z: 0,
    rotationOrder: "XYZ",
  },
  Hips: {
    position: {
      x: 0.009826546907424905,
      y: 0,
      z: -0.4867018217668233,
    },
    worldPosition: {
      x: -0.00453158195232334,
      y: 0,
      z: -0.4611571078848962,
    },
    rotation: {
      x: 0,
      y: 0.2743397512486982,
      z: 0.0003709216445107318,
    },
  },
  Spine: {
    x: 0,
    y: 0.2714237930344275,
    z: 0.07454435135366712,
  },
};

export function print_children(obj: THREE.Object3D<THREE.Object3DEventMap>) {
  if (DEBUG_PRINT_ENABLED) {
    do_print_children(obj);
  }
}

function do_print_children(
  obj: THREE.Object3D<THREE.Object3DEventMap>,
  level: number = 0,
) {
  const space = "  ".repeat(level);
  console.log(`${space} - ${obj.name}`);

  for (const i in obj.children) {
    const child = obj.children[i];
    do_print_children(child, level + 1);
  }
}

function rotateChildBone(
  obj: THREE.Object3D<THREE.Object3DEventMap>,
  name: string,
  x: number,
  y: number,
  z: number,
) {
  const child = obj.getObjectByName(name);
  if (!child) {
    return;
  }
  child.rotation.x = x;
  child.rotation.y = y;
  child.rotation.z = z;
}

function mapRotation(
  obj: THREE.Object3D<THREE.Object3DEventMap>,
  sourceName: string,
  destinationName: string,
  rotation = { x: 0, y: 0, z: 0 },
) {
  const sourceRotation = EXAMPLE_POSE[sourceName as keyof typeof EXAMPLE_POSE];
  if (!sourceRotation) {
    console.error(`No rotation named ${sourceName}`);
    return;
  }
  // if sourceRotation is a HipsPose, we need to use the rotation property
  if (typeof sourceRotation === "object" && "rotation" in sourceRotation) {
    rotateChildBone(
      obj,
      destinationName,
      sourceRotation.rotation.x,
      sourceRotation.rotation.y,
      sourceRotation.rotation.z,
    );
  } else {
    rotateChildBone(
      obj,
      destinationName,
      sourceRotation.x,
      sourceRotation.y,
      sourceRotation.z,
    );
  }
}

function mapRotationFrom(
  obj: THREE.Object3D<THREE.Object3DEventMap>,
  source: any,
  sourceName: string,
  destinationName: string,
) {
  const sourceRotation = source[sourceName];
  if (!sourceRotation) {
    console.error(`No rotation named ${sourceName}`);
    return;
  }
  rotateChildBone(
    obj,
    destinationName,
    sourceRotation.x,
    sourceRotation.y,
    sourceRotation.z,
  );
}


// Define the structure of the Kalidokit pose
interface PoseRotation {
  x: number;
  y: number;
  z: number;
  rotationOrder?: EulerOrder;
}

interface PosePosition {
  x: number;
  y: number;
  z: number;
}

interface HipsPose {
  position: PosePosition;
  worldPosition: PosePosition;
  rotation: PoseRotation;
}

interface KalidokitPose {
  RightUpperArm: PoseRotation;
  RightLowerArm: PoseRotation;
  LeftUpperArm: PoseRotation;
  LeftLowerArm: PoseRotation;
  RightHand: PoseRotation;
  LeftHand: PoseRotation;
  RightUpperLeg: PoseRotation;
  RightLowerLeg: PoseRotation;
  LeftUpperLeg: PoseRotation;
  LeftLowerLeg: PoseRotation;
  Hips: HipsPose;
  Spine: PoseRotation;
}

// Define the mapping from Kalidokit bones to Mixamo bones
const BONE_MAPPING: Record<string, string[]> = {
  // Spine & Hips
  Spine: ["mixamorigSpine", "mixamorigSpine1", "mixamorigSpine2"],
  // Hips: ["mixamorigHips"],

  // Arms
  RightUpperArm: ["mixamorigRightArm"],
  RightLowerArm: ["mixamorigRightForeArm"],
  LeftUpperArm: ["mixamorigLeftArm"],
  LeftLowerArm: ["mixamorigLeftForeArm"],

  // Legs
  RightUpperLeg: ["mixamorigRightUpLeg"],
  RightLowerLeg: ["mixamorigRightLeg"],
  LeftUpperLeg: ["mixamorigLeftUpLeg"],
  LeftLowerLeg: ["mixamorigLeftLeg"],

  // Hands
  RightHand: ["mixamorigRightHand"],
  LeftHand: ["mixamorigLeftHand"],
};

function findSkinnedMesh(object: THREE.Object3D): THREE.SkinnedMesh | null {
  let skinnedMesh: THREE.SkinnedMesh | null = null;

  object.traverse((child) => {
    if (child instanceof THREE.SkinnedMesh) {
      skinnedMesh = child;
    }
  });

  return skinnedMesh;
}

// Add helper function to apply the transformation
function applyTransform(operation: TransformOperation, value: number): number {
  if (operation.startsWith('-')) {
    return -value;
  }
  return value;
}

// Update rigBoneRotation to use the new type-safe transform
function rigBoneRotation(
  bone: THREE.Bone,
  boneName: string,
  rotation: PoseRotation,
  dampener: number = 1,
  lerpAmount: number = 0.3,
) {
  const transformation = mixamorigTransformations[boneName];
  if (!transformation) {
    console.error(`No transformation named ${boneName}`);
    return;
  }

  console.log("Rigging bone", boneName, rotation);

  const oldRotation = bone.rotation.clone();

  const transformOperations = transformation.func;
  const order = transformation.order;

  // Map the rotations according to the transformation functions
  // For example, if fx is "-z", we map rotation.z with a negative sign
  const mappedRotations = {
    x: applyTransform(transformOperations.fx, rotation[transformOperations.fx.replace('-', '') as 'x' | 'y' | 'z'] * dampener),
    y: applyTransform(transformOperations.fy, rotation[transformOperations.fy.replace('-', '') as 'x' | 'y' | 'z'] * dampener),
    z: applyTransform(transformOperations.fz, rotation[transformOperations.fz.replace('-', '') as 'x' | 'y' | 'z'] * dampener),
  };

  const euler = new THREE.Euler(
    mappedRotations.x,
    mappedRotations.y,
    mappedRotations.z,
    order
  );

  const quaternion = new THREE.Quaternion().setFromEuler(euler);

  bone.quaternion.premultiply(quaternion);

  const newRotation = bone.rotation.clone();

  // log the bone name if the rotation didn't change
  if (oldRotation.x === newRotation.x && oldRotation.y === newRotation.y && oldRotation.z === newRotation.z) {
    console.log(`Rotation didn't change for bone ${boneName}`);
  }

  bone.updateMatrixWorld(true);
}


function findBoneRecursive(
  rootBone: THREE.Bone,
  name: string,
): THREE.Bone | null {
  if (rootBone.name === name) return rootBone;

  for (const child of rootBone.children) {
    const foundBone = findBoneRecursive(child as THREE.Bone, name);
    if (foundBone) return foundBone;
  }
  return null;
}
function getBoneUpdateOrder(
  rootBone: THREE.Bone,
  order: string[] = [],
): string[] {
  order.push(rootBone.name);
  for (const child of rootBone.children) {
    getBoneUpdateOrder(child as THREE.Bone, order);
  }
  return order;
}

function applyPoseToMixamo(
  character: THREE.Object3D,
  kalidokitPose: KalidokitPose,
) {
  const skinnedMesh = findSkinnedMesh(character);
  if (!skinnedMesh) {
    return;
  }
  const bones = skinnedMesh.skeleton.bones;
  if (!bones) {
    return;
  }

  const rootBone = bones[0];
  const boneUpdateOrder = getBoneUpdateOrder(rootBone);

  const missingBones: string[] = [];
  const bonesTransformed: string[] = [];

  // Use mixamorigTransformations keys instead of BONE_MAPPING
  for (const kalidokitBone of Object.keys(mixamorigTransformations)) {
    console.log("Rigging bone", kalidokitBone);
    const mixamoBoneName = mixamorigTransformations[kalidokitBone].name;
    const bone = findBoneRecursive(rootBone, mixamoBoneName);

    if (!bone) {
      missingBones.push(mixamoBoneName);
      continue;
    }

    const poseRotation =
      kalidokitBone === "Hips"
        ? kalidokitPose.Hips.rotation
        : kalidokitPose[kalidokitBone as keyof Omit<KalidokitPose, "Hips">];

    if (poseRotation && typeof poseRotation === "object") {
      rigBoneRotation(bone, kalidokitBone, poseRotation);
      bonesTransformed.push(kalidokitBone);
    }
  }

  // Log missing bones if any
  if (missingBones.length > 0) {
    console.warn("⚠️ Missing Mixamo Bones:", missingBones);
  } else {
    console.log("All Mixamo bones found and mapped correctly!");
  }

  console.log("Bones transformed:", bonesTransformed);
  console.log("Bone update order:", boneUpdateOrder);
  console.log("Missing bones:", missingBones);
  console.log("Bones not transformed:", boneUpdateOrder.filter(bone => !bonesTransformed.includes(bone)));

  skinnedMesh.skeleton.update();
  skinnedMesh.updateMatrixWorld(true);
}

export function testDeformBody(obj: THREE.Object3D<THREE.Object3DEventMap>) {
  if (!DEBUG_ENABLED) {
    return;
  }

  applyPoseToMixamo(obj, EXAMPLE_POSE);
}

export async function testGlobalExperiment() {
  const firstFrameUrl: string | undefined = (window as any).firstFrameMediaUrl;
  const characterRig: THREE.Object3D<THREE.Object3DEventMap> | undefined = (
    window as any
  ).lastCharacter;
  if (!firstFrameUrl || !characterRig) {
    return;
  }
  doTest(firstFrameUrl, characterRig);
}

async function doTest(
  firstFrameUrl: string,
  characterRig: THREE.Object3D<THREE.Object3DEventMap>,
) {
  //rotateChildBone(characterRig, "mixamorigLeftLeg", 1, 2, 0);
  //rotateChildBone(characterRig, "mixamorigRightArm", 0, 1, 2);
  //rotateChildBone(characterRig, "mixamorigLeftShoulder", 2, 0, 2);
  //rotateChildBone(characterRig, "mixamorigHead", 1, 1, 1);

  //const poseHelper = new CharacterPoseHelper(editorEngine!);
  //const pose = poseHelper.extractPoseData(firstFrameUrl);

  const image = await loadImageFromAnonymousOriginUrl(firstFrameUrl);
  console.debug("Loaded image for inference", image, image.width, image.height);

  // Solve Holistic (NB: Not yet working)
  //const holisticLandmarks = await solveHolisticForImage(image);
  //(window as any).holisticLandmarks = holisticLandmarks;
  //const poseWorld3DArray : any = holisticLandmarks.poseWorldLandmarks[0];
  //const poseLandmarkArray : any = holisticLandmarks.poseLandmarks[0];

  // Solve Pose

  const solutions = (await CachedPoseLandmarker.getInstance()).detectForImage(image);

  console.log("mediapipe solution", solutions);
  (window as any).solutions = solutions;

  const poseWorld3DArray: any = solutions.worldLandmarks[0];
  const poseLandmarkArray: any = solutions.landmarks[0];

  const solution = Kalidokit.Pose.solve(poseWorld3DArray, poseLandmarkArray, {
    runtime: "mediapipe", // default is 'mediapipe'
    //video: HTMLVideoElement,// specify an html video or manually set image size
    imageSize: {
      width: image.width,
      height: image.height,
    },
  });

  console.log("kalidokit pose solution", solution);

  // Apply the pose to the character rig
  applyPoseToMixamo(characterRig, solution as KalidokitPose);

  // mapRotationFrom(characterRig, solution, "Spine", "mixamorigSpine");

  // mapRotationFrom(characterRig, solution, "RightHand", "mixamorigRightHand");
  // mapRotationFrom(characterRig, solution, "LeftHand", "mixamorigLeftHand");

  // mapRotationFrom(characterRig, solution, "RightUpperArm", "mixamorigRightArm");
  // mapRotationFrom(characterRig, solution, "LeftUpperArm", "mixamorigLeftArm");

  // mapRotationFrom(
  //   characterRig,
  //   solution,
  //   "RightLowerArm",
  //   "mixamorigRightForeArm",
  // );
  // mapRotationFrom(
  //   characterRig,
  //   solution,
  //   "LeftLowerArm",
  //   "mixamorigLeftForeArm",
  // );

  // NB: Holistic not yet working
  //let faceSolution = Kalidokit.Face.solve(holisticLandmarks.faceLandmarks[0], {
  //  runtime: 'mediapipe',
  //  imageSize:{
  //      width: image.width,
  //      height: image.height,
  //  }
  //});

  //console.log('kalidokit face solution', faceSolution);

  //mapRotationFrom(characterRig, faceSolution, "head", "mixamorigHead");
}

async function solveHolisticForImage(
  image: HTMLImageElement,
): Promise<HolisticLandmarkerResult> {
  // TODO: Cache this.
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
  );

  //let holistic = new Holistic({locateFile: (file) => {
  //  return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.4.1633559476/${file}`;
  //}});

  //holistic.onResults(results=>{
  //  // do something with prediction results
  //  // landmark names may change depending on TFJS/Mediapipe model version
  //  let facelm = results.faceLandmarks;
  //  let poselm = results.poseLandmarks;
  //  let poselm3D = results.ea;
  //  let rightHandlm = results.rightHandLandmarks;
  //  let leftHandlm = results.leftHandLandmarks;

  //  let faceRig = Kalidokit.Face.solve(facelm,{runtime:'mediapipe',video:HTMLVideoElement})
  //  let poseRig = Kalidokit.Pose.solve(poselm3d,poselm,{runtime:'mediapipe',video:HTMLVideoElement})
  //  let rightHandRig = Kalidokit.Hand.solve(rightHandlm,"Right")
  //  let leftHandRig = Kalidokit.Hand.solve(leftHandlm,"Left")

  //  };
  //});

  //const holisticLandmarker = await HolisticLandmarker.createFromModelPath(filesetResolver,
  //  "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/hand_landmark.task"
  //);
  const holisticLandmarker = await HolisticLandmarker.createFromOptions(
    filesetResolver,
    {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/hand_landmark.task",
        delegate: "CPU", // GPU does not work (?) https://github.com/google-ai-edge/mediapipe/issues/5166
      },
      runningMode: "IMAGE",
    },
  );

  const landmarks = holisticLandmarker.detect(image);

  console.debug("Holistic landmark results: ", landmarks);

  return landmarks;
}
