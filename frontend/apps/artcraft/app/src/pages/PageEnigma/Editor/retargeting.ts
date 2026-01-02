export class MoveAIResult {
    bone: string;
    is_special: boolean;
    x: number;
    y: number;
    z: number;
    flip: boolean;
    only_y: boolean;
    
    constructor(bone: string, is_special: boolean = false, x: number = 0, y: number = 0, z: number = 0, 
        flip:boolean=false, only_y:boolean=false) {
        this.bone = bone;
        this.is_special = is_special;
        this.x = x;
        this.y = y;
        this.z = z;
        this.flip = flip;
        this.only_y = only_y;
    }
}

export class Retarget {
    move_ai_options: { [Key: string]: MoveAIResult }
    constructor() {
        this.move_ai_options = {
            "_1Head.quaternion": new MoveAIResult("mixamorigHead.quaternion"),
            "_1Neck.quaternion": new MoveAIResult("mixamorigNeck.quaternion"),
            "_Spine.quaternion": new MoveAIResult("mixamorigSpine.quaternion"),
            "_1Spine.quaternion": new MoveAIResult("mixamorigSpine1.quaternion"),
            "_3Spine.quaternion": new MoveAIResult("mixamorigSpine2.quaternion"),
            
            "_1Hips.quaternion": new MoveAIResult("mixamorigHips.quaternion", true, -90, 0, 0, false, true),
            "_1Hips.position": new MoveAIResult("mixamorigHips.position", true, 1, 0.05, 1),

            "_1LeftFoot.quaternion": new MoveAIResult("mixamorigLeftFoot.quaternion", true,   0, 0, 0, true),
            "_1RightFoot.quaternion": new MoveAIResult("mixamorigRightFoot.quaternion", true, 0, 0, 0, true),


            "_1RightShoulder.quaternion": new MoveAIResult("mixamorigRightShoulder.quaternion",   true, 0, 0, 0, false),
            "_1LeftShoulder.quaternion": new MoveAIResult("mixamorigLeftShoulder.quaternion", true, 0, 0, 0, false),
            "_1LeftArm.quaternion": new MoveAIResult("mixamorigLeftArm.quaternion",   true, 0, 0, 0, false),
            "_1RightArm.quaternion": new MoveAIResult("mixamorigRightArm.quaternion", true, 0, 0, 0, false),
            "_1LeftForeArm.quaternion": new MoveAIResult("mixamorigLeftForeArm.quaternion"),
            "_1RightForeArm.quaternion": new MoveAIResult("mixamorigRightForeArm.quaternion"),

            "_1LeftLeg.quaternion": new MoveAIResult("mixamorigLeftLeg.quaternion",       true, 0, 0, 0, true),
            "_1RightLeg.quaternion": new MoveAIResult("mixamorigRightLeg.quaternion",     true, 0, 0, 0, true),
            
            "_1LeftUpLeg.quaternion": new MoveAIResult("mixamorigLeftUpLeg.quaternion",   true, 0, 180, 0),
            "_1RightUpLeg.quaternion": new MoveAIResult("mixamorigRightUpLeg.quaternion", true, 0, 180, 0),

            "_1LeftHand.quaternion": new MoveAIResult("mixamorigLeftHand.quaternion"),
            "_1RightHand.quaternion": new MoveAIResult("mixamorigRightHand.quaternion"),

            "_1LeftHandThumb1.quaternion": new MoveAIResult("mixamorigLeftHandThumb1.quaternion"),
            "_1LeftHandThumb2.quaternion": new MoveAIResult("mixamorigLeftHandThumb2.quaternion"),
            "_1LeftHandThumb3.quaternion": new MoveAIResult("mixamorigLeftHandThumb3.quaternion"),
            "_1LeftHandIndex1.quaternion": new MoveAIResult("mixamorigLeftHandIndex1.quaternion"),
            "_1LeftHandIndex2.quaternion": new MoveAIResult("mixamorigLeftHandIndex2.quaternion"),
            "_1LeftHandIndex3.quaternion": new MoveAIResult("mixamorigLeftHandIndex3.quaternion"),
            "_1LeftHandMiddle1.quaternion": new MoveAIResult("mixamorigLeftHandMiddle1.quaternion"),
            "_1LeftHandMiddle2.quaternion": new MoveAIResult("mixamorigLeftHandMiddle2.quaternion"),
            "_1LeftHandMiddle3.quaternion": new MoveAIResult("mixamorigLeftHandMiddle3.quaternion"),
            "_1LeftHandRing1.quaternion": new MoveAIResult("mixamorigLeftHandRing1.quaternion"),
            "_1LeftHandRing2.quaternion": new MoveAIResult("mixamorigLeftHandRing2.quaternion"),
            "_1LeftHandRing3.quaternion": new MoveAIResult("mixamorigLeftHandRing3.quaternion"),
            "_1LeftHandPinky1.quaternion": new MoveAIResult("mixamorigLeftHandPinky1.quaternion"),
            "_1LeftHandPinky2.quaternion": new MoveAIResult("mixamorigLeftHandPinky2.quaternion"),
            "_1LeftHandPinky3.quaternion": new MoveAIResult("mixamorigLeftHandPinky3.quaternion"),
            "_1RightHandThumb1.quaternion": new MoveAIResult("mixamorigRightHandThumb1.quaternion"),
            "_1RightHandThumb2.quaternion": new MoveAIResult("mixamorigRightHandThumb2.quaternion"),
            "_1RightHandThumb3.quaternion": new MoveAIResult("mixamorigRightHandThumb3.quaternion"),
            "_1RightHandIndex1.quaternion": new MoveAIResult("mixamorigRightHandIndex1.quaternion"),
            "_1RightHandIndex2.quaternion": new MoveAIResult("mixamorigRightHandIndex2.quaternion"),
            "_1RightHandIndex3.quaternion": new MoveAIResult("mixamorigRightHandIndex3.quaternion"),
            "_1RightHandMiddle1.quaternion": new MoveAIResult("mixamorigRightHandMiddle1.quaternion"),
            "_1RightHandMiddle2.quaternion": new MoveAIResult("mixamorigRightHandMiddle2.quaternion"),
            "_1RightHandMiddle3.quaternion": new MoveAIResult("mixamorigRightHandMiddle3.quaternion"),
            "_1RightHandRing1.quaternion": new MoveAIResult("mixamorigRightHandRing1.quaternion"),
            "_1RightHandRing2.quaternion": new MoveAIResult("mixamorigRightHandRing2.quaternion"),
            "_1RightHandRing3.quaternion": new MoveAIResult("mixamorigRightHandRing3.quaternion"),
            "_1RightHandPinky1.quaternion": new MoveAIResult("mixamorigRightHandPinky1.quaternion"),
            "_1RightHandPinky2.quaternion": new MoveAIResult("mixamorigRightHandPinky2.quaternion"),
            "_1RightHandPinky3.quaternion": new MoveAIResult("mixamorigRightHandPinky3.quaternion"),
        }

    }

    retarget(boneName: string): MoveAIResult {
        for (const [key, value] of Object.entries(this.move_ai_options)) {
            if (boneName == key) {
                return value;
            }
        }
        return new MoveAIResult(boneName);
    }
}
