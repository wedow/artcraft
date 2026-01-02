// A mapping between the model bones names and the Mediapipe output index
export const MixamoPoseMap: Record<string, number> = {
  "mixamorigLeftArm": 11,
  "mixamorigRightArm": 12,
  "mixamorigLeftForeArm": 13,
  "mixamorigRightForeArm": 14,
  "mixamorigLeftHand": 15,
  "mixamorigRightHand": 16,
  "mixamorigLeftUpLeg": 23,
  "mixamorigRightUpLeg": 24,
  "mixamorigLeftLeg": 25,
  "mixamorigRightLeg": 26,
  "mixamorigLeftFoot": 27,
  "mixamorigRightFoot": 28,
  "mixamorigLeftHandThumb2": 21,
  "mixamorigRightHandThumb2": 22,
}

export const MixamoInterpolationBoneNames = {
  Spine: "mixamorigSpine",
  Spine1: "mixamorigSpine1",
  Spine2: "mixamorigSpine2",
  Neck: "mixamorigNeck",
  LeftShoulderBlade: "mixamorigLeftShoulder",
  DefLeftUpperArm: "DEF-upper_armL001",
  DefLeftForeArm: "DEF-forearmL001",
  RightShoulderBlade: "mixamorigRightShoulder",
  DefRightUpperArm: "DEF-upper_armR001",
  DefRightForeArm: "DEF-forearmR001",
  DefLeftThigh: "DEF-thighL001",
  DefRightThigh: "DEF-thighR001",
}

export const PoseMap = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}
