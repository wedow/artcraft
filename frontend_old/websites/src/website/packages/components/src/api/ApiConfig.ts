export interface ListTtsInferenceResultsForUserArgs {
  username: string;
  cursor?: string;
  cursor_is_reversed?: boolean;
  sort_ascending?: boolean;
  limit?: number;
}

export interface ListW2lInferenceResultsForUserArgs {
  username: string;
  cursor?: string;
  cursor_is_reversed?: boolean;
  sort_ascending?: boolean;
  limit?: number;
}

export interface GetUserRatingArgs {
  entity_type: string;
  entity_token: string;
}

enum Domain {
  Localhost,
  JungleHorse,
  Vocodes,
  FakeYou,
  Storyteller,
  StorytellerStream,
  DevFakeYou, // dev.fakeyou.com
  DevStoryteller, // dev.storyteller.io
  Unknown,
}

class ApiConfig {
  useSsl: boolean;
  apiHost: string;

  constructor() {
    let useSsl = true;
    let apiHost = "api.fakeyou.com";

    switch (document.location.host) {
      case "fakeyou.com":
      case "staging.fakeyou.com":
        apiHost = "api.fakeyou.com";
        break;
      case "storyteller.ai":
      case "staging.storyteller.ai":
        apiHost = "api.storyteller.ai";
        break;
      case "storyteller.stream":
        // Storyteller.stream is deprecated and will be decommissioned in the future.
        apiHost = "api.storyteller.stream";
        break;
      case "devproxy.fakeyou.com":
      case "devproxy.fakeyou.com:7000":
      case "devproxy.fakeyou.com:7001":
        apiHost = "api.fakeyou.com";
        useSsl = true;
        break;
      case "devproxy.storyteller.ai":
      case "devproxy.storyteller.ai:7000":
      case "devproxy.storyteller.ai:7001":
        //apiHost = "api.storyteller.ai";
        apiHost = "api.fakeyou.com";
        useSsl = true;
        break;
      case "dev.fakeyou.com":
        // NB: for dev machines with nginx proxies
        apiHost = "api.dev.fakeyou.com";
        break;
      case "dev.fakeyou.com:7000":
      case "dev.fakeyou.com:7001":
      case "dev.fakeyou.com:7002":
        // NB: for dev machines without nginx proxies
        apiHost = "api.dev.fakeyou.com:12345";
        useSsl = false;
        break;
      default:
        if (document.location.host.includes("localhost")) {
          // NB: `localhost` seems to have problems with cookies.
          useSsl = document.location.protocol === "https:";
          apiHost = "localhost:12345";
        }
        break;
    }

    this.useSsl = useSsl;
    this.apiHost = apiHost;
    this.useSsl = true;
    this.apiHost = "api.fakeyou.com";
  }

  speakEndpoint(): string {
    return "https://mumble.stream/speak_spectrogram";
  }

  speakSpectrogramEndpoint(): string {
    return "https://mumble.stream/speak_spectrogram";
  }

  createAccount(): string {
    return `${this.getApiOrigin()}/v1/create_account`;
  }

  googleCreateAccount(): string {
    return `${this.getApiOrigin()}/v1/accounts/google_sso`;
  }

  login(): string {
    return `${this.getApiOrigin()}/v1/login`;
  }

  passwordResetRequest(): string {
    return `${this.getApiOrigin()}/v1/password_reset/request`;
  }

  passwordResetRedeem(): string {
    return `${this.getApiOrigin()}/v1/password_reset/redeem`;
  }

  logout(): string {
    return `${this.getApiOrigin()}/v1/logout`;
  }

  sessionDetails(): string {
    return `${this.getApiOrigin()}/v1/session`;
  }

  listTts(): string {
    return `${this.getApiOrigin()}/tts/list`;
  }

  searchWeights(): string {
    return `${this.getApiOrigin()}/v1/weights/search`;
  }

  getPendingTtsJobCount(): string {
    return `${this.getApiOrigin()}/tts/queue_length`;
  }

  viewTtsModel(modelSlug: string): string {
    return `${this.getApiOrigin()}/tts/model/${modelSlug}`;
  }

  deleteTtsModel(modelToken: string): string {
    return `${this.getApiOrigin()}/tts/model/${modelToken}/delete`;
  }

  editTtsModel(modelToken: string): string {
    return `${this.getApiOrigin()}/tts/model/${modelToken}/edit`;
  }

  getTtsModelUseCount(modelToken: string): string {
    return `${this.getApiOrigin()}/tts/model/${modelToken}/count`;
  }

  viewTtsInferenceResult(token: string): string {
    return `${this.getApiOrigin()}/tts/result/${token}`;
  }

  deleteTtsInferenceResult(resultToken: string): string {
    return `${this.getApiOrigin()}/tts/result/${resultToken}/delete`;
  }

  editTtsInferenceResult(resultToken: string): string {
    return `${this.getApiOrigin()}/tts/result/${resultToken}/edit`;
  }

  listTtsModelsForUser(username: string): string {
    return `${this.getApiOrigin()}/user/${username}/tts_models`;
  }

  listTtsInferenceResultsForUser(
    params: ListTtsInferenceResultsForUserArgs
  ): string {
    const base_url = `${this.getApiOrigin()}/user/${
      params.username
    }/tts_results`;

    let query = "";
    let query_prepend = "?";

    if (params.cursor !== undefined) {
      query += `${query_prepend}cursor=${params.cursor}`;
      query_prepend = "&";

      if (params.cursor_is_reversed !== undefined) {
        query += `${query_prepend}cursor_is_reversed=${params.cursor_is_reversed}`;
      }
    }

    if (params.sort_ascending !== undefined) {
      query += `${query_prepend}sort_ascending=${params.sort_ascending}`;
      query_prepend = "&";
    }

    if (params.limit !== undefined) {
      query += `${query_prepend}limit=${params.limit}`;
    }

    return base_url + query;
  }

  getTtsModelUploadJobState(jobToken: string): string {
    return `${this.getApiOrigin()}/tts/upload_model_job/${jobToken}`;
  }

  uploadTts(): string {
    return `${this.getApiOrigin()}/tts/upload`;
  }

  uploadW2l(): string {
    return `${this.getApiOrigin()}/w2l/upload`;
  }

  listW2l(): string {
    return `${this.getApiOrigin()}/w2l/list`;
  }

  viewW2l(templateToken: string): string {
    return `${this.getApiOrigin()}/w2l/template/${templateToken}`;
  }

  viewW2lTemplate(templateToken: string): string {
    return this.viewW2l(templateToken);
  }

  editW2lTemplate(templateToken: string): string {
    return `${this.getApiOrigin()}/w2l/template/${templateToken}/edit`;
  }

  deleteW2lTemplate(templateToken: string): string {
    return `${this.getApiOrigin()}/w2l/template/${templateToken}/delete`;
  }

  getW2lTemplateUseCount(templateSlug: string): string {
    return `${this.getApiOrigin()}/w2l/template/${templateSlug}/count`;
  }

  moderateW2l(templateSlug: string): string {
    return `${this.getApiOrigin()}/w2l/template/${templateSlug}/moderate`;
  }

  viewW2lInferenceResult(token: string): string {
    return `${this.getApiOrigin()}/w2l/result/${token}`;
  }

  editW2lInferenceResult(token: string): string {
    return `${this.getApiOrigin()}/w2l/result/${token}/edit`;
  }

  deleteW2lInferenceResult(resultToken: string): string {
    return `${this.getApiOrigin()}/w2l/result/${resultToken}/delete`;
  }

  inferTts(): string {
    return `${this.getApiOrigin()}/tts/inference`;
  }

  inferW2l(): string {
    return `${this.getApiOrigin()}/w2l/inference`;
  }

  getProfile(username: string): string {
    return `${this.getApiOrigin()}/user/${username}/profile`;
  }

  editProfile(username: string): string {
    return `${this.getApiOrigin()}/user/${username}/edit_profile`;
  }

  listW2lTemplatesForUser(username: string): string {
    return `${this.getApiOrigin()}/user/${username}/w2l_templates`;
  }

  getW2lInferenceJobState(jobToken: string): string {
    return `${this.getApiOrigin()}/w2l/job/${jobToken}`;
  }

  getW2lTemplateUploadJobState(jobToken: string): string {
    return `${this.getApiOrigin()}/w2l/upload_template_job/${jobToken}`;
  }

  listW2lInferenceResultsForUser(
    params: ListTtsInferenceResultsForUserArgs
  ): string {
    const base_url = `${this.getApiOrigin()}/user/${
      params.username
    }/w2l_results`;

    let query = "";
    let query_prepend = "?";

    if (params.cursor !== undefined) {
      query += `${query_prepend}cursor=${params.cursor}`;
      query_prepend = "&";

      if (params.cursor_is_reversed !== undefined) {
        query += `${query_prepend}cursor_is_reversed=${params.cursor_is_reversed}`;
      }
    }

    if (params.sort_ascending !== undefined) {
      query += `${query_prepend}sort_ascending=${params.sort_ascending}`;
      query_prepend = "&";
    }

    if (params.limit !== undefined) {
      query += `${query_prepend}limit=${params.limit}`;
    }

    return base_url + query;
  }

  listVocoderModels(): string {
    return `${this.getApiOrigin()}/vocoder/list`;
  }

  getVocoderModel(vocoderToken: string): string {
    return `${this.getApiOrigin()}/vocoder/model/${vocoderToken}`;
  }

  createCategory(): string {
    return `${this.getApiOrigin()}/category/create`;
  }

  getCategory(categoryToken: string): string {
    return `${this.getApiOrigin()}/category/view/${categoryToken}`;
  }

  assignTtsCategory(): string {
    return `${this.getApiOrigin()}/category/assign/tts`;
  }

  listTtsCategories(): string {
    // TODO: Move to /v1
    return `${this.getApiOrigin()}/category/list/tts`;
  }

  listTtsCategoriesForModel(ttsModelToken: string): string {
    return `${this.getApiOrigin()}/category/assignments/tts/${ttsModelToken}`;
  }

  getComputedTtsCategoryAssignments(): string {
    return `${this.getApiOrigin()}/v1/category/computed_assignments/tts`;
  }

  firehoseEvents(): string {
    return `${this.getApiOrigin()}/events`;
  }

  getLeaderboard(): string {
    return `${this.getApiOrigin()}/leaderboard`;
  }

  getModerationIpBanList(): string {
    return `${this.getApiOrigin()}/moderation/ip_bans/list`;
  }

  createModerationIpBan(): string {
    return `${this.getApiOrigin()}/moderation/ip_bans/add`;
  }

  getModerationIpBan(ipAddress: string): string {
    return `${this.getApiOrigin()}/moderation/ip_bans/${ipAddress}`;
  }

  deleteModerationIpBan(ipAddress: string): string {
    return `${this.getApiOrigin()}/moderation/ip_bans/${ipAddress}/delete`;
  }

  banUser(): string {
    return `${this.getApiOrigin()}/moderation/user_bans/manage_ban`;
  }

  getModerationUserList(): string {
    return `${this.getApiOrigin()}/moderation/user/list`;
  }

  getTtsVoiceInventoryStats(): string {
    return `${this.getApiOrigin()}/moderation/stats/tts_voices`;
  }

  getTtsInferenceStats(): string {
    return `${this.getApiOrigin()}/moderation/jobs/tts_inference_queue_stats`;
  }

  killTtsInferenceJobs(): string {
    return `${this.getApiOrigin()}/moderation/jobs/kill_tts_inference_jobs`;
  }

  killJobs(): string {
    return `${this.getApiOrigin()}/moderation/jobs/kill_generic`;
  }

  getW2lInferenceStats(): string {
    return `${this.getApiOrigin()}/moderation/jobs/w2l_inference_queue_stats`;
  }

  getModerationPendingW2lTemplates(): string {
    return `${this.getApiOrigin()}/moderation/pending/w2l_templates`;
  }

  getModerationTtsCategoryList(): string {
    return `${this.getApiOrigin()}/moderation/categories/tts/list`;
  }

  moderatorEditCategory(categoryToken: string): string {
    return `${this.getApiOrigin()}/moderation/categories/${categoryToken}/edit`;
  }

  moderatorSetCategoryDeletionState(categoryToken: string): string {
    return `${this.getApiOrigin()}/moderation/categories/${categoryToken}/delete`;
  }

  createVoiceCloneRequest(): string {
    return `${this.getApiOrigin()}/voice_clone_requests/create`;
  }

  checkVoiceCloneRequest(): string {
    return `${this.getApiOrigin()}/voice_clone_requests/check`;
  }

  // =============== Weights Files ===============

  getWeights(params: string): string {
    return `${this.getApiOrigin()}/v1/weights/list${params}`;
  }

  getWeight(params: string): string {
    return `${this.getApiOrigin()}/v1/weights/weight/${params}`;
  }

  // =============== File Uploads ===============

  uploadAudio(): string {
    return `${this.getApiOrigin()}/v1/media_uploads/upload_audio`;
  }

  uploadImage(): string {
    return `${this.getApiOrigin()}/v1/media_uploads/upload_image`;
  }

  // =============== Voice Conversion ===============

  listVoiceConversionModels(): string {
    return `${this.getApiOrigin()}/v1/voice_conversion/model_list`;
  }

  enqueueVoiceConversion(): string {
    return `${this.getApiOrigin()}/v1/voice_conversion/inference`;
  }

  // =============== Face Animation ===============

  enqueueFaceAnimation(): string {
    return `${this.getApiOrigin()}/v1/animation/face_animation/create`;
  }

  // =============== Image Generation ===============

  enqueueImageGeneration(): string {
    return `${this.getApiOrigin()}/v1/image_gen/enqueue/inference`;
  }

  // =============== Motion Capture / mocap ===============
  enqueueVideoMotionCapture(): string {
    return `${this.getApiOrigin()}/v1/mocap/mocapnet/create`;
  }

  // =============== Convert FBX to glTF ===============
  enqueueFbxToGltf(): string {
    return `${this.getApiOrigin()}/v1/conversion/enqueue_fbx_to_gltf`;
  }

  // =============== Generic Model Inference ===============

  getModelInferenceJobStatus(jobToken: string): string {
    return `${this.getApiOrigin()}/v1/model_inference/job_status/${jobToken}`;
  }

  getPendingModelInferenceJobCount(): string {
    return `${this.getApiOrigin()}/v1/model_inference/queue_length`;
  }

  // =============== User Ratings ===============

  getUserRating(args: GetUserRatingArgs): string {
    return `${this.getApiOrigin()}/v1/user_rating/view/${args.entity_type}/${
      args.entity_token
    }`;
  }

  setUserRating(): string {
    return `${this.getApiOrigin()}/v1/user_rating/rate`;
  }

  // =============== Comments ===============

  commentCreate(): string {
    return `${this.getApiOrigin()}/v1/comments/new`;
  }

  commentList(entityType: string, entityToken: string): string {
    return `${this.getApiOrigin()}/v1/comments/list/${entityType}/${entityToken}`;
  }

  commentDelete(commentToken: string): string {
    return `${this.getApiOrigin()}/v1/comments/delete/${commentToken}`;
  }

  // =============== Premium ===============

  listActiveSubscriptions(): string {
    return `${this.getApiOrigin()}/v1/billing/active_subscriptions`;
  }

  createStripeCheckoutRedirect(): string {
    return `${this.getApiOrigin()}/v1/stripe/checkout/create_redirect`;
  }

  createStripePortalRedirect(): string {
    return `${this.getApiOrigin()}/v1/stripe/portal/create_redirect`;
  }

  // =============== Helper ===============

  private getScheme(): string {
    return this.useSsl ? "https" : "http";
  }

  private getApiHost(): string {
    return this.apiHost;
  }

  private getApiOrigin(): string {
    return `${this.getScheme()}://${this.getApiHost()}`;
  }
}

export { ApiConfig };
