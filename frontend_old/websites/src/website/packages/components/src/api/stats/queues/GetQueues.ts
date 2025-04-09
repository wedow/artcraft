import MakeRequest from "../../MakeRequest";

export interface LegacyTtsInfo {
  pending_job_count: number,
}

export interface ByQueueStats {
  pending_face_animation_jobs: number,
  pending_rvc_jobs: number,
  pending_stable_diffusion: number,
  pending_svc_jobs: number,
  pending_tacotron2_jobs: number,
  pending_voice_designer: number,
}

export interface InferenceInfo {
  pending_job_count: number,
  by_queue: ByQueueStats,
  total_pending_job_count: number
}

export interface GetQueuesRequest {}

export interface GetQueuesResponse {
  cache_time: Date,
  inference: InferenceInfo,
  legacy_tts: LegacyTtsInfo,
  refresh_interval_millis: number,
  success: boolean
}

export const QueuePollRefreshDefault = 15000;

export const BaseQueueObject = () => ({
  success: true,
  cache_time: new Date(0), // NB: Epoch is used for vector clock's initial state
  refresh_interval_millis: QueuePollRefreshDefault,
  inference: {
    total_pending_job_count: 0,
    pending_job_count: 0,
    by_queue: {
      pending_face_animation_jobs: 0,
      pending_rvc_jobs: 0,
      pending_svc_jobs: 0,
      pending_tacotron2_jobs: 0,
      pending_voice_designer: 0,
      pending_stable_diffusion: 0,
    },
  },
  legacy_tts: {
    pending_job_count: 0,
  },
})

export const GetQueues = MakeRequest<string,GetQueuesRequest,GetQueuesResponse,{}>({
  method: "GET",
  routingFunction: (mediaFileToken: string) => `/v1/stats/queues`,
});
