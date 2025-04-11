import * as THREE from "three";
import { Retarget } from "../retargeting";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { get_media_url } from "~/Classes/ApiHelpers";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader.js";
import { ClipUI } from "../../clips/clip_ui";
import Ijson from "~/interfaces/Ijson";
import { CharacterPoseHelper } from "./Helpers/CharacterPoseHelper";

export const START_FRAME_LABEL = "CharacterStartFrameLabel";

export class CharacterAnimationEngine implements Ijson {
  version: number;
  characterAnimations: Map<THREE.Object3D<THREE.Object3DEventMap>, ClipUI[]> = new Map();
  characterMixers = new Map<THREE.Object3D<THREE.Object3DEventMap>, THREE.AnimationMixer>();

  constructor(version: number) {
    this.version = version;
  }

  toJSON(): unknown {
    // Return just an array of character object IDs
    const characterIds = Array.from(this.characterAnimations.keys()).map((character) => character.uuid);
    return { characters: characterIds };
  }

  /**
   * A single character model is capable of tracking multiple animations, in its own track
   * These tracks can be blended with weights or additively
   * The weight change can be done via custom interpolation logic
   *
   * @param objectUUID The UUID of the object.
   * @param clip The 3JS animation clip
   * @param clipUI The clip info
   */
  addCharacterAnimation(character: THREE.Object3D, clip: THREE.AnimationClip, clipUI: ClipUI) {
    // If character doesn't exist, create a clip object
    // If it does exist, add a new animation to the existing character by extracting it
    // TODO: FIXME: Duplicate prevention?
    clip.name = clipUI.media_id;
    character.animations.push(clip);
    console.log("Adding animation track:")
    console.log(clip);

    if (!this.characterAnimations.has(character)) {
      this.characterAnimations.set(character, []);
      this.#ensureMixerExists(character);
    }

    // Add the clip info to the character map and sort the clips
    const characterClips = this.characterAnimations.get(character)!;
    characterClips.push(clipUI);
    characterClips.sort((a, b) => a.offset - b.offset);
  }

  /**
   * @param objectUUID The UUID of the object.
   * @param mediaId The media ID of the animation.
   * @param clipUI The clip info
   */
  async addCharacterAnimationMedia(character: THREE.Object3D, mediaId: string, clipUI: ClipUI) {
    // If character doesn't exist, create a clip object
    // If it does exist, add a new animation to the existing character by extracting it
    // TODO: FIXME: Duplicate prevention?
    const animationTrack = await this.#load_animation(character, mediaId);
    this.addCharacterAnimation(character, animationTrack, clipUI);
  }

  #ensureMixerExists(character: THREE.Object3D) {
    if (!this.characterMixers.has(character)) {
      this.characterMixers.set(character, new THREE.AnimationMixer(character));
    }
  }

  getMixer(character: THREE.Object3D) {
    this.#ensureMixerExists(character);
    return this.characterMixers.get(character)!;
  }

  #interpolateClips(character: THREE.Object3D, timestamp: number, maxTime: number) {
    const clips = this.characterAnimations.get(character);

    const mixer = this.getMixer(character);

    // Find the two clips we're interpolating between
    let prevClip: ClipUI | null = null;
    let nextClip: ClipUI | null = null;
    const firstClip = clips ? clips[0] : null;
    const lastClip = clips ? clips[clips.length - 1] : null;

    // If we're before the first clip, interpolate it in from base pose
    // TODO: Replace with starting frame
    if (firstClip && firstClip.offset > timestamp) {
      prevClip = null;
      nextClip = firstClip;
    } else if (lastClip && (lastClip.offset + lastClip.length) < timestamp) { // After last clip, interpolate it out
      prevClip = lastClip;
      nextClip = null;
    } else if (clips) {
      let prevClipIndex = 0;

      // Loop until the next clip is after the timestamp
      while (prevClipIndex < clips.length - 1 && clips[prevClipIndex + 1].offset < timestamp) {
        prevClipIndex++;
      }

      prevClip = clips[prevClipIndex];
      nextClip = clips[prevClipIndex + 1];
    }

    // If the clips exist, fetch their actions. If not, evaluation is either at the start or the end.
    // If evalution is on either sides, check the start/end frame tracks
    // Otherwise just mark it null
    const prevAnimationTrack = prevClip ?
      this.getCharacterAnimationTrack(character, prevClip.media_id) :
      this.getCharacterAnimationTrack(character, START_FRAME_LABEL);

    // TODO: Replace with ending frame
    const nextAnimationTrack = nextClip ? this.getCharacterAnimationTrack(character, nextClip.media_id) : null;

    const prevAction = prevAnimationTrack ? mixer.clipAction(prevAnimationTrack) : null;
    const nextAction = nextAnimationTrack ? mixer.clipAction(nextAnimationTrack) : null;

    // Calculate the progress of timestamp from end of prev action to start of next action
    const left = (prevClip?.offset ?? 0) + (prevClip?.length ?? 0);
    const right = nextClip?.offset ?? maxTime;

    // Simple Linear interpolation for now
    // TODO: Take an interpolation dependency, or better yet, write a transition engine
    const progress = (timestamp - left) / (right - left);
    prevAction?.setEffectiveWeight(1 - progress);
    nextAction?.setEffectiveWeight(progress);

    // Make sure we hold that last frame for the previous action
    if (prevAction) {
      prevAction.clampWhenFinished = true;
    }

    // The next action should stay at the first frame
    if (nextAction) {
      nextAction.paused = true;
    }

    // Necessary to ensure the actions are active - the default is inactive, mixer won't do anything
    prevAction?.play();
    nextAction?.play();

    // The clip time would still be relative to the previous clip 
    const clipTime = timestamp - (prevClip?.offset ?? 0);
    mixer.setTime(clipTime / 1000);
  }

  evaluateCharacter(character: THREE.Object3D, timestamp: number, maxTime: number) {
    const mixer = this.getMixer(character);
    const clips = this.characterAnimations.get(character);

    // Find the clip we're in right now
    const currentClip = clips?.find((clip) => {
      return clip.offset <= timestamp && clip.offset + clip.length >= timestamp;
    });

    // If timestamp not in any clip, do nothing.
    // If timestamp in clip, set mixer to the timestamp inside the clip
    if (!currentClip) {
      // Let the interpolation function handle this actions
      this.#interpolateClips(character, timestamp, maxTime)
      return;
    }

    const clipTime = timestamp - currentClip.offset;
    const animationTrack = this.getCharacterAnimationTrack(character, currentClip.media_id);

    // NOTE: This shouldn't really happen unless the UI was desynced at some point from the engine
    if (!animationTrack) {
      return;
    }

    // Play only this action
    const animationAction = mixer.clipAction(animationTrack);

    // Since it's the only clip in this timestamp, make it full weight and make sure it's not paused (from interpolation or otherwise)
    animationAction.setEffectiveWeight(1);
    animationAction.paused = false;

    // Necessary to ensure the actions are active - the default is inactive, mixer won't do anything
    animationAction.play();

    mixer.setTime(clipTime / 1000);
  }

  getCharacterAnimationTrack(character: THREE.Object3D, mediaId: string) {
    return character.animations.find((clip) => clip.name === mediaId);
  }

  /** Evaluate all character animations at a given timestamp (milliseconds) */
  evaluate(timestamp: number, maxTime: number) {
    this.characterMixers.forEach((_, character) => {
      this.evaluateCharacter(character, timestamp, maxTime);
    })
  }

  stopCharacter(character: THREE.Object3D) {
    const mixer = this.characterMixers.get(character);
    console.debug("Stopping all actions for character", character);
    console.debug(mixer);
    mixer?.stopAllAction();
    console.debug(mixer);
  }

  stop() {
    this.characterMixers.forEach((mixer) => {
      mixer.stopAllAction();
    });
  }

  async #load_animation(character: THREE.Object3D, mediaId: string): Promise<THREE.AnimationClip> {
    // Get the file URL and extract the (first) animation track from it
    // TODO: Support for multiple animations in a single file?
    const url = await get_media_url(mediaId);

    return await new Promise((resolve) => {
      if (url.includes(".glb")) {
        const glbLoader = new GLTFLoader();

        glbLoader.load(url, (gltf) => {
          const animationClip = gltf.animations[0];
          resolve(animationClip);
        });
      } else if (url.includes(".fbx")) {
        const fbxLoader = new FBXLoader();
        fbxLoader.load(url, (fbx) => {
          const animationClip_1 = fbx.animations[0];
          animationClip_1.tracks.forEach((track) => {
            const retarget = new Retarget();
            const retarget_value = retarget.retarget(track.name);
            track.name = retarget_value.bone;
            console.log(track);
            if (retarget_value.is_special) {
              // TODO: Revisit special properties later
              // this.special_properties.push(retarget_value);
            }
          });
          resolve(animationClip_1);
        });
      } else if (url.includes(".vmd")) {
        const mmdLoader = new MMDLoader();
        mmdLoader.loadAnimation(url, character as THREE.SkinnedMesh, (mmd) => {
          mmd.name = url;
          resolve(mmd as THREE.AnimationClip);
        });
      }
    });
  }

  removeCharacter(character: THREE.Object3D) {
    console.debug("Removing character from animation engine", character);
    this.characterAnimations.delete(character);
    this.characterMixers.delete(character);
  }

  removeAnimation(character: THREE.Object3D, clip: ClipUI) {
    console.debug("Removing animation from character", character, clip);
    const clips = this.characterAnimations.get(character)!;

    const clipIndex = clips.findIndex((c) => c.clip_uuid === clip.clip_uuid);
    if (clipIndex < 0) {
      return;
    }

    // Remove the clip from character's tracked clips
    clips.splice(clipIndex, 1);

    // Stop all character animations to cleanly reset
    this.stopCharacter(character);
  }

  clearStartFrame(character: THREE.Object3D, resetTime?: number, maxTime = 1) {
    // Stop all character animations
    this.stopCharacter(character);

    // Check the animations and remove any labelled START_FRAME_LABEL
    character.animations = character.animations.filter((clip) => clip.name !== START_FRAME_LABEL);

    // If resetTime is passed, evaluate the character to that time
    if (resetTime) {
      this.evaluateCharacter(character, resetTime, maxTime);
    }
  }

  /** resetTime: The time to reset the character to. This should ideally be the current timeline time. */
  async createStartFrameAnimation(character: THREE.Object3D, poseHelper: CharacterPoseHelper, url: string, resetTime: number = 0, maxTime: number = 1) {
    // Clear any existing start frame
    // This will also reset the animation to default pose
    this.clearStartFrame(character);

    // We must create the track data now after resetting to default
    const poseData = await poseHelper.extractPoseData(url);
    const tracks = poseHelper.inflatePoseDataToTracks(character, poseData);

    // Create the animation track from the rotation values and hip position
    // then add it to the character
    const startFrameClip = new THREE.AnimationClip(START_FRAME_LABEL, 0, tracks);
    character.animations.push(startFrameClip);

    // Reset the character evaluation to what was passed in
    this.evaluateCharacter(character, resetTime, maxTime);
  }
}
