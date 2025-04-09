import { SessionSubscriptionsWrapper } from "@storyteller/components/src/session/SessionSubscriptionsWrapper";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";

export interface FaceAnimatorSlide {
  audioProps: any;
  children?: any;
  imageProps: any;
  frameDimensions: any;
  frameDimensionsChange: any;
  disableFaceEnhancement: any;
  disableFaceEnhancementChange: any;
  index: number;
  preferPresetAudio?: any;
  preferPresetAudioSet?: any;
  presetAudio?: any;
  still: any;
  stillChange: any;
  style: any;
  toggle: any;
  enqueueInferenceJob: any;
  t: any;
  removeWatermark: any;
  removeWatermarkChange: any;
}

export interface FaceAnimatorCore {
  sessionSubscriptionsWrapper: SessionSubscriptionsWrapper;
}
