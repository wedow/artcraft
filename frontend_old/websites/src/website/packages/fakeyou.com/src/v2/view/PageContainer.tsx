import React, { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "react-router-dom";
import ProfileSidePanel from "components/layout/ProfileSidePanel/ProfileSidePanel";
import TopNav from "components/layout/TopNav/TopNav";
import ScrollToTop from "./_common/ScrollToTop";
import { Spinner } from "components/common";
import LandingPage from "./pages/landing/LandingPage";
import { AdHorizontal } from "components/common/AdBanner";

const routes = [
  {
    path: "/",
    fixedComponent: LandingPage,
    exact: true,
  },
  {
    path: "/about",
    component: lazy(() => import("./pages/about/about_page/AboutPage")),
  },
  {
    path: "/firehose",
    component: lazy(() => import("./pages/firehose/FirehoseEventListPage")),
  },
  {
    path: "/news",
    component: lazy(() => import("./pages/news/NewsPage")),
  },
  {
    path: "/leaderboard",
    component: lazy(() => import("./pages/leaderboard/LeaderboardPage")),
  },
  {
    path: "/login",
    component: lazy(() => import("./pages/login/LoginPage")),
  },
  {
    path: "/password-reset/verify",
    component: lazy(
      () => import("./pages/password_reset/PasswordResetVerificationPage")
    ),
  },
  {
    path: "/password-reset",
    component: lazy(
      () => import("./pages/password_reset/PasswordResetEmailPage")
    ),
  },
  {
    path: "/profile/:username/edit", // verify
    component: lazy(() => import("./pages/profile/profile_edit/ProfileEditFc")),
  },
  {
    path: "/profile/:username/ban", // verify
    component: lazy(() => import("./pages/profile/profile_ban/ProfileBanFc")),
  },
  {
    path: "/profile/:username", // verify
    component: lazy(() => import("./pages/profile/profile_view/ProfilePageV3")),
  },
  {
    path: "/signup",
    component: lazy(() => import("./pages/signup/SignupPage")),
  },
  {
    path: "/set-username",
    component: lazy(() => import("./pages/signup/SetUsernameModal")),
  },
  {
    path: "/pricing",
    component: lazy(() => import("./pages/premium/PricingPage")),
  },
  {
    path: "/checkout_success",
    component: lazy(() => import("./pages/premium/CheckoutSuccessPage")),
  },
  {
    path: "/checkout_cancel",
    component: lazy(() => import("./pages/premium/CheckoutCancelPage")),
  },
  {
    path: "/portal_success",
    component: lazy(() => import("./pages/premium/PortalSuccessPage")),
  },
  {
    path: "/media/rename/:media_file_token",
    component: lazy(() => import("./pages/media/MediaRenamePage")),
  },
  {
    path: "/media/:token",
    component: lazy(() => import("./pages/media/MediaPageSwitch")),
  },
  {
    path: "/edit-cover-image/:token",
    component: lazy(() => import("./pages/media/EditCoverImage")),
  },
  {
    path: "/explore",
    component: lazy(() => import("./pages/explore/ExplorePage")),
  },
  {
    path: "/weight/:weight_token/edit",
    component: lazy(() => import("./pages/weight/WeightEditPage")),
  },
  {
    path: "/weight/:weight_token/:maybe_url_slug?",
    component: lazy(() => import("./pages/weight/WeightPage")),
  },
  {
    path: "/search/weights",
    component: lazy(() => import("./pages/search/SearchPage")),
  },
  {
    path: "/tts/result/:token/edit",
    component: lazy(
      () => import("./pages/tts/tts_result_edit/TtsResultEditPage")
    ),
  },
  {
    path: "/tts/result/:token/delete",
    component: lazy(
      () => import("./pages/tts/tts_result_delete/TtsResultDeletePage")
    ),
  },
  {
    path: "/tts/result/:token",
    component: lazy(
      () => import("./pages/tts/tts_result_view/TtsResultViewPage")
    ),
  },
  {
    path: "/tts/:token/edit",
    component: lazy(
      () => import("./pages/tts/tts_model_edit/TtsModelEditPage")
    ),
  },
  {
    path: "/tts/:token/delete",
    component: lazy(
      () => import("./pages/tts/tts_model_delete/TtsModelDeletePage")
    ),
  },
  {
    path: "/tts/:token/categories",
    component: lazy(
      () => import("./pages/tts/tts_edit_categories/TtsEditCategoriesPage")
    ),
  },
  {
    path: "/tts/:token",
    component: lazy(
      () => import("./pages/tts/tts_model_view/TtsModelViewPage")
    ),
  },
  {
    path: "/w2l/result/:token/edit",
    component: lazy(
      () => import("./pages/w2l/w2l_result_edit/W2lResultEditPage")
    ),
  },
  {
    path: "/w2l/result/:token/delete",
    component: lazy(
      () => import("./pages/w2l/w2l_result_delete/W2lResultDeletePage")
    ),
  },
  {
    path: "/w2l/result/:token",
    component: lazy(
      () => import("./pages/w2l/w2l_result_view/W2lResultViewPage")
    ),
  },
  {
    path: "/w2l/:templateToken/edit",
    component: lazy(
      () => import("./pages/w2l/w2l_template_edit/W2lTemplateEditPage")
    ),
  },
  {
    path: "/w2l/:templateToken/approval",
    component: lazy(
      () => import("./pages/w2l/w2l_template_approve/W2lTemplateApprovePage")
    ),
  },
  {
    path: "/w2l/:templateToken/delete",
    component: lazy(
      () => import("./pages/w2l/w2l_template_delete/W2lTemplateDeletePage")
    ),
  },
  {
    path: "/video",
    component: lazy(
      () => import("./pages/w2l/w2l_template_list/W2lTemplateListPage")
    ),
  },
  {
    path: "/upload/tts",
    component: lazy(() => import("./pages/upload/UploadTtsModelPage")),
  },
  {
    path: "/upload/tts_model",
    component: lazy(() => import("./pages/upload/UploadNewTtsModelPage")),
  },
  {
    path: "/upload/sd",
    component: lazy(() => import("./pages/upload/UploadSdWeightPage")),
  },
  {
    path: "/upload/lora",
    component: lazy(() => import("./pages/upload/UploadLoraWeightPage")),
  },
  {
    path: "/upload/workflow",
    component: lazy(() => import("./pages/upload/UploadWorkflowPage")),
  },
  {
    path: "/contribute",
    component: lazy(() => import("./pages/contribute/ContributeIndexPage")),
  },
  {
    path: "/moderation/user/list",
    component: lazy(
      () => import("./pages/moderation/moderation_user_list/ModerationUserList")
    ),
  },
  {
    path: "/moderation/user_feature_flags/:username?",
    component: lazy(
      () =>
        import(
          "./pages/moderation/moderation_user_feature_flags/ModerationUserFeatureFlagsPage"
        )
    ),
  },
  {
    path: "/moderation/ip_bans/:ipAddress",
    component: lazy(
      () =>
        import(
          "./pages/moderation/moderation_view_ip_ban/ModerationViewIpBanFc"
        )
    ),
  },
  {
    path: "/moderation/ip_bans",
    component: lazy(
      () =>
        import(
          "./pages/moderation/moderation_ip_ban_list/ModerationIpBanListFc"
        )
    ),
  },
  {
    path: "/moderation/voice_stats",
    component: lazy(
      () =>
        import(
          "./pages/moderation/moderation_voice_stats/ModerationVoiceStatsFc"
        )
    ),
  },
  {
    path: "/moderation/job_stats",
    component: lazy(
      () =>
        import("./pages/moderation/moderation_job_stats/ModerationJobStatsFc")
    ),
  },
  {
    path: "/moderation/job_control",
    component: lazy(
      () => import("./pages/moderation/job_control/ModerationJobControlPage")
    ),
  },
  {
    path: "/moderation/token_info",
    component: lazy(() => import("./pages/moderation/ModerationTokenInfoPage")),
  },
  {
    path: "/moderation/tts_category/list",
    component: lazy(
      () =>
        import("./pages/moderation/categories/ModerationTtsCategoryListPage")
    ),
  },
  {
    path: "/moderation/tts_category/edit/:token",
    component: lazy(
      () =>
        import("./pages/moderation/categories/ModerationTtsCategoryEditPage")
    ),
  },
  {
    path: "/moderation/category/delete/:token",
    component: lazy(
      () => import("./pages/moderation/categories/ModerationCategoryDeletePage")
    ),
  },
  {
    path: "/moderation/approve/w2l_templates",
    component: lazy(
      () =>
        import(
          "./pages/moderation/moderation_pending_w2l_templates/ModerationPendingW2lTemplatesFc"
        )
    ),
  },
  {
    path: "/moderation",
    component: lazy(
      () => import("./pages/moderation/moderation_main/ModerationPage")
    ),
  },
  {
    path: "/clone",
    component: lazy(
      () => import("./pages/clone_voice_requests/VoiceCloneRequestPage")
    ),
  },
  {
    path: "/patrons",
    component: lazy(() => import("./pages/patrons/PatronPage")),
  },
  {
    path: "/product-usage",
    component: lazy(
      () => import("./pages/product_usage_info/ProductUsageInfoPage")
    ),
  },
  {
    path: "/voice-conversion/:token/delete",
    component: lazy(
      () => import("./pages/vc/vc_model_delete/VcModelDeletePage")
    ),
  },
  {
    path: "/voice-conversion/:token/edit",
    component: lazy(() => import("./pages/vc/vc_model_edit/VcModelEditPage")),
  },
  {
    path: "/voice-conversion/:token",
    component: lazy(() => import("./pages/vc/vc_model_view/VcModelViewPage")),
  },
  {
    path: "/dashboard",
    component: lazy(() => import("./pages/dashboard/DashboardPage")),
  },
  {
    path: "/face-animator/:mediaToken?",
    component: lazy(() => import("./pages/face_animator")),
  },
  {
    path: "/fbx-to-gltf/:mediaToken?",
    component: lazy(() => import("./pages/fbx_to_gltf/FbxToGltfPage")),
  },
  {
    path: "/commissions",
    component: lazy(() => import("./pages/contest/CommunityCommissionsPage")),
  },
  {
    path: "/guide",
    component: lazy(() => import("./pages/about/guide_page/GuidePage")),
  },
  {
    path: "/old",
    component: lazy(() => import("./pages/vocodes/VocodesPage")),
  },
  {
    path: "/dev-upload",
    component: lazy(() => import("./pages/dev_upload/DevUpload")),
  },
  {
    path: "/dev-upload-alt",
    component: lazy(() => import("./pages/dev_upload/DevUploadAlt")),
  },
  {
    path: "/dev-media-input",
    component: lazy(() => import("./pages/dev_upload/DevMediaInput")),
  },
  {
    path: "/tts",
    component: lazy(() => import("./pages/audio_gen/tts/NewTTS")),
  },
  {
    path: "/voice-conversion",
    component: lazy(() => import("./pages/audio_gen/vc/NewVC")),
  },
  {
    path: "/ai-live-portrait",
    component: lazy(() => import("./pages/live_portrait/LivePortrait")),
  },
  {
    path: "/ai-lip-sync",
    component: lazy(() => import("./pages/lipsync/Lipsync")),
  },
  {
    path: "/webcam-acting",
    component: lazy(() => import("./pages/live_portrait/CameraLivePortrait")),
  },
  {
    path: "/voice-designer/create",
    component: lazy(
      () => import("./pages/voice_designer/VoiceDesignerFormPage")
    ),
    exact: true,
  },
  {
    path: "/voice-designer/dataset/:dataset_token/edit",
    component: lazy(
      () => import("./pages/voice_designer/VoiceDesignerFormPage")
    ),
    exact: true,
  },
  {
    path: "/voice-designer/dataset/:dataset_token/upload",
    component: lazy(
      () => import("./pages/voice_designer/VoiceDesignerFormPage")
    ),
    exact: true,
  },
  {
    path: "/voice-designer/voice/:voice_token/edit",
    component: lazy(
      () => import("./pages/voice_designer/VoiceDesignerVoiceEditPage")
    ),
  },
  {
    path: "/voice-designer/voice/:voice_token",
    component: lazy(
      () => import("./pages/voice_designer/VoiceDesignerUseVoicePage")
    ),
  },
  {
    path: "/inference-jobs-list",
    component: lazy(
      () => import("./pages/inference_jobs_page/InferenceJobsPage")
    ),
  },
  {
    path: "/voice-designer",
    component: lazy(
      () => import("./pages/voice_designer/VoiceDesignerMainPage")
    ),
  },
  {
    path: "/f5-tts",
    component: lazy(() => import("./pages/f5_tts/F5TTS")),
  },
  {
    path: "/board",
    component: lazy(() => import("./pages/board/Board")),
  },
  {
    path: "/seed-vc",
    component: lazy(() => import("./pages/seed_vc/SeedVC")),
  },
  {
    path: "/hallo2",
    component: lazy(() => import("./pages/hallo2/Hallo2")),
  },
  {
    path: "/cogvideo",
    component: lazy(() => import("./pages/cogvideo/CogVideo")),
  },
  {
    path: "/style-video/:mediaToken?",
    component: lazy(() => import("./pages/style-video")),
  },
  {
    path: "/video-mocap/:mediaToken?",
    component: lazy(() => import("./pages/video_mocap")),
  },
  {
    path: "/text-to-image",
    component: lazy(() => import("./pages/text_to_image/TextToImagePage")),
  },
  {
    path: "/terms",
    component: lazy(() => import("./pages/about/terms_page/TermsPage")),
  },
  {
    path: "/privacy",
    component: lazy(() => import("./pages/about/privacy_page/PrivacyPage")),
  },
  {
    path: "/character/donald-trump",
    component: lazy(() => import("./pages/audio_gen/tts/NewTrumpTTS")),
  },
  {
    path: "/beta/3d-video-compositor/form",
    component: lazy(
      () => import("./pages/beta_products/Beta3DVideoCompositorForm")
    ),
  },
  {
    path: "/beta/3d-video-compositor",
    component: lazy(
      () => import("./pages/beta_products/Beta3DVideoCompositorPage")
    ),
  },
  {
    path: "/beta/2d-video-compositor/form",
    component: lazy(
      () => import("./pages/beta_products/BetaVideoCompositorForm")
    ),
  },
  {
    path: "/beta/2d-video-compositor",
    component: lazy(
      () => import("./pages/beta_products/BetaVideoCompositorPage")
    ),
  },
  {
    path: "/beta/lip-sync/form",
    component: lazy(() => import("./pages/beta_products/BetaLipSyncForm")),
  },
  {
    path: "/beta/lip-sync",
    component: lazy(() => import("./pages/beta_products/BetaLipSyncPage")),
  },
  {
    path: "/studio-mobile-check",
    component: lazy(
      () =>
        import(
          "./pages/landing/storyteller/PostlaunchLanding/StudioMobileCheckPage"
        )
    ),
  },
  {
    path: "/category/create",
    component: lazy(() => import("./pages/category/CreateCategoryPage")),
  },
  {
    path: "/creator-onboarding",
    component: lazy(
      () =>
        import(
          "./pages/landing/storyteller/PostlaunchLanding/CreatorTypeformPage"
        )
    ),
  },
  {
    path: "/welcome",
    component: lazy(() => import("./pages/beta_key/SignUpSuccessPage")),
  },
  {
    path: "/beta-key/create",
    component: lazy(() => import("./pages/beta_key/CreateBetaKeyPage")),
  },
  {
    path: "/beta-key/redeem/success",
    component: lazy(() => import("./pages/beta_key/RedeemSuccessPage")),
  },
  {
    path: "/beta-key/redeem/:token?",
    component: lazy(() => import("./pages/beta_key/RedeemBetaKeyPage")),
  },
  {
    path: "/beta-key/list",
    component: lazy(() => import("./pages/beta_key/BetaKeysListPage")),
  },
  {
    path: "/dev/tools",
    component: lazy(() => import("./pages/tools_test/ToolsTestPage")),
  },
  {
    path: "/tools",
    component: lazy(() => import("./pages/creator_tools/CreatorToolsPage")),
  },
  {
    path: "/waitlist-next-steps",
    component: lazy(
      () => import("./pages/waitlist_next_steps/WaitlistNextStepsPage")
    ),
  },
].map(
  (
    { fixedComponent: FixedComponent, path, component: PageComponent, exact },
    key
  ) => {
    return (
      <Route {...{ key, path, exact }}>
        {FixedComponent ? (
          <FixedComponent />
        ) : PageComponent ? (
          <Suspense {...{ fallback: Spinner }}>
            <PageComponent />
          </Suspense>
        ) : null}
      </Route>
    );
  }
);

export default function PageContainer() {
  const location = useLocation();

  const hideAdPaths = ["/login", "/signup"];
  const shouldShowAd = !hideAdPaths.includes(location.pathname);

  return (
    <>
      <ScrollToTop />
      <div id="wrapper" className="no-padding">
        <TopNav />
        {shouldShowAd && <AdHorizontal container={true} />}
        <ProfileSidePanel />
        <Switch>{routes}</Switch>
      </div>
    </>
  );
}
