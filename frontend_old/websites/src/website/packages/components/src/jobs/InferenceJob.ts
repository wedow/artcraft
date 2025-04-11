import {
  LipsyncDetails,
  LivePortraitDetails,
  ModelInferenceJobStatus,
} from "../api/model_inference/GetModelInferenceJobStatus";
import { JobState, jobStateFromString } from "./JobStates";

// Type of inference job (specified by the frontend, not backend)
export enum FrontendInferenceJobType {
  Unknown,
  FaceAnimation, // lipsync_animation
  TextToSpeech, // text_to_speech
  VoiceConversion, // voice_conversion
  VoiceDesignerCreateVoice,
  VoiceDesignerTts,
  ImageGeneration, // image_generation
  VideoMotionCapture, // mocap ?
  ConvertFbxtoGltf, // format_conversion
  EngineComposition, // convert_bvh_to_workflow ?
  VideoWorkflow, // workflow ?
  VideoStyleTransfer, // video_filter
  LivePortrait, // live_portrait
  F5Tts, // f5_tts
  SeedVc, // seed_vc
}

export enum AllInferenceJobs {
  All,
}

export type JobListOptions = FrontendInferenceJobType | AllInferenceJobs;

// NB: Many of these fields are optional despite the response payload containing them
// This is because we create temporary placeholder objects with just the token.
export class InferenceJob {
  // PK
  jobToken: string;
  createdAt: Date;

  frontendJobType: FrontendInferenceJobType;

  // Status
  jobState: JobState;
  maybeExtraStatusDescription: string | null;
  attemptCount: number;
  progressPercentage: number;

  // Request
  maybeModelType?: string;
  maybeModelToken?: string;
  maybeModelTitle?: string;
  maybeRawInferenceText?: string;
  maybeLivePortraitDetails?: LivePortraitDetails;
  maybeLipsyncDetails?: LipsyncDetails;
  maybeStyleName?: string;

  // Result
  maybeResultType: string | undefined | null;
  maybeResultToken: string | undefined | null;
  maybeResultPublicBucketMediaPath: string | undefined | null;
  maybeFailureCategory: string | undefined | null;

  constructor(
    // PK
    jobToken: string,
    createdAt: Date,
    // Frontend state
    frontendJobType: FrontendInferenceJobType,
    // Status
    status: string = "unknown",
    maybeExtraStatusDescription: string | null = null,
    attemptCount: number = 0,
    progressPercentage: number = 0,
    // Request
    maybeModelType: string | undefined = undefined,
    maybeModelToken: string | undefined = undefined,
    maybeModelTitle: string | undefined = undefined,
    maybeRawInferenceText: string | undefined = undefined,
    maybeLivePortraitDetails: LivePortraitDetails | undefined = undefined,
    maybeLipsyncDetails: LipsyncDetails | undefined = undefined,
    maybeStyleName: string | undefined = undefined,
    // Result
    maybeResultEntityType: string | undefined | null = null,
    maybeResultEntityToken: string | undefined | null = null,
    maybeResultPublicBucketMediaPath: string | undefined | null = null,
    maybeFailureCategory: string | undefined | null = null
  ) {
    this.jobToken = jobToken;
    this.createdAt = createdAt;
    this.frontendJobType = frontendJobType;
    this.jobState = jobStateFromString(status);
    this.maybeExtraStatusDescription = maybeExtraStatusDescription;
    this.attemptCount = attemptCount;
    this.progressPercentage = progressPercentage;

    if (!!maybeModelType) {
      this.maybeModelTitle = maybeModelType;
    }
    if (!!maybeModelToken) {
      this.maybeModelToken = maybeModelToken;
    }
    if (!!maybeModelTitle) {
      this.maybeModelTitle = maybeModelTitle;
    }

    this.maybeRawInferenceText = maybeRawInferenceText;

    this.maybeLivePortraitDetails = maybeLivePortraitDetails;

    this.maybeLipsyncDetails = maybeLipsyncDetails;

    if (!!maybeResultEntityType) {
      this.maybeStyleName = maybeStyleName;
    }

    if (!!maybeResultEntityType) {
      this.maybeResultType = maybeResultEntityType;
    }
    if (!!maybeResultEntityToken) {
      this.maybeResultToken = maybeResultEntityToken;
    }

    this.maybeResultPublicBucketMediaPath = maybeResultPublicBucketMediaPath;

    if (!!maybeFailureCategory) {
      this.maybeFailureCategory = maybeFailureCategory;
    }
  }

  static fromResponse(
    response: ModelInferenceJobStatus,
    frontendJobType: FrontendInferenceJobType
  ): InferenceJob {
    return new InferenceJob(
      response.job_token,
      response.created_at,
      frontendJobType,
      response.status.status,
      response.status.maybe_extra_status_description || null,
      response.status.attempt_count || 0,
      response.status.progress_percentage || 0,
      response.request.maybe_model_type,
      response.request.maybe_model_token,
      response.request.maybe_model_title,
      response.request.maybe_raw_inference_text,
      response.request.maybe_live_portrait_details,
      response.request.maybe_lipsync_details,
      response.request.maybe_style_name,
      response.maybe_result?.entity_type,
      response.maybe_result?.entity_token,
      response.maybe_result?.maybe_public_bucket_media_path,
      response.status.maybe_failure_category
    );
  }
}
