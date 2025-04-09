import React from "react";
import { Switch, Route } from "react-router-dom";
import ProfileSidePanel from "components/layout/ProfileSidePanel/ProfileSidePanel";
import TopNav from "components/layout/TopNav/TopNav";

import AboutPage from "./pages/about/about_page/AboutPage";
import GuidePage from "./pages/about/guide_page/GuidePage";
import FirehoseEventListPage from "./pages/firehose/FirehoseEventListPage";
import LoginPage from "./pages/login/LoginPage";
import ModerationPage from "./pages/moderation/moderation_main/ModerationPage";
import ModerationIpBanListFc from "./pages/moderation/moderation_ip_ban_list/ModerationIpBanListFc";
import ModerationViewIpBanFc from "./pages/moderation/moderation_view_ip_ban/ModerationViewIpBanFc";
import FaceAnimator from "./pages/face_animator";
import VideoMocap from "./pages/video_mocap";
import ProfileEditFc from "./pages/profile/profile_edit/ProfileEditFc";
import SignupPage from "./pages/signup/SignupPage";
import TtsModelDeletePage from "./pages/tts/tts_model_delete/TtsModelDeletePage";
import TtsModelEditPage from "./pages/tts/tts_model_edit/TtsModelEditPage";
import TtsModelViewPage from "./pages/tts/tts_model_view/TtsModelViewPage";
import TtsResultDeletePage from "./pages/tts/tts_result_delete/TtsResultDeletePage";
import TtsResultViewPage from "./pages/tts/tts_result_view/TtsResultViewPage";
import ContributeIndexPage from "./pages/contribute/ContributeIndexPage";
import UploadTtsModelPage from "./pages/upload/UploadTtsModelPage";
import UploadSdWeightPage from "./pages/upload/UploadSdWeightPage";
import UploadLoraWeightPage from "./pages/upload/UploadLoraWeightPage";
import UploadWorkflowPage from "./pages/upload/UploadWorkflowPage";
import W2lResultViewPage from "./pages/w2l/w2l_result_view/W2lResultViewPage";
import W2lTemplateListPage from "./pages/w2l/w2l_template_list/W2lTemplateListPage";
import TtsResultEditPage from "./pages/tts/tts_result_edit/TtsResultEditPage";
import W2lResultEditPage from "./pages/w2l/w2l_result_edit/W2lResultEditPage";
import W2lTemplateDeletePage from "./pages/w2l/w2l_template_delete/W2lTemplateDeletePage";
import W2lTemplateEditPage from "./pages/w2l/w2l_template_edit/W2lTemplateEditPage";
import W2lResultDeletePage from "./pages/w2l/w2l_result_delete/W2lResultDeletePage";
import W2lTemplateApprovePage from "./pages/w2l/w2l_template_approve/W2lTemplateApprovePage";
import ProfileBanFc from "./pages/profile/profile_ban/ProfileBanFc";
import ModerationUserListFc from "./pages/moderation/moderation_user_list/ModerationUserList";
import LeaderboardPage from "./pages/leaderboard/LeaderboardPage";
import ModerationJobStatsFc from "./pages/moderation/moderation_job_stats/ModerationJobStatsFc";
import ModerationUserFeatureFlagsPage from "./pages/moderation/moderation_user_feature_flags/ModerationUserFeatureFlagsPage";
import ModerationPendingW2lTemplatesFc from "./pages/moderation/moderation_pending_w2l_templates/ModerationPendingW2lTemplatesFc";
import ModerationVoiceStatsFc from "./pages/moderation/moderation_voice_stats/ModerationVoiceStatsFc";
import CreateCategoryPage from "./pages/category/CreateCategoryPage";
import TtsEditCategoriesPage from "./pages/tts/tts_edit_categories/TtsEditCategoriesPage";
import ModerationTtsCategoryListPage from "./pages/moderation/categories/ModerationTtsCategoryListPage";
import ModerationTtsCategoryEditPage from "./pages/moderation/categories/ModerationTtsCategoryEditPage";
import ModerationCategoryDeletePage from "./pages/moderation/categories/ModerationCategoryDeletePage";
import PatronPage from "./pages/patrons/PatronPage";
import VoiceCloneRequestPage from "./pages/clone_voice_requests/VoiceCloneRequestPage";
import VocodesPage from "./pages/vocodes/VocodesPage";
import PricingPage from "./pages/premium/PricingPage";
import CheckoutSuccessPage from "./pages/premium/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/premium/CheckoutCancelPage";
import PortalSuccessPage from "./pages/premium/PortalSuccessPage";
import NewsPage from "./pages/news/NewsPage";
import LandingPage from "./pages/landing/LandingPage";
import CommunityCommissionsPage from "./pages/contest/CommunityCommissionsPage";
import ProductUsageInfoPage from "./pages/product_usage_info/ProductUsageInfoPage";
import VcModelViewPage from "./pages/vc/vc_model_view/VcModelViewPage";
import VcModelEditPage from "./pages/vc/vc_model_edit/VcModelEditPage";
import VcModelDeletePage from "./pages/vc/vc_model_delete/VcModelDeletePage";
import MediaPageSwitch from "./pages/media/MediaPageSwitch";
import EditCoverImage from "./pages/media/EditCoverImage";
import MediaRenamePage from "./pages/media/MediaRenamePage";
import VoiceDesignerFormPage from "./pages/voice_designer/VoiceDesignerFormPage";
import VoiceDesignerMainPage from "./pages/voice_designer/VoiceDesignerMainPage";
import VoiceDesignerVoiceEditPage from "./pages/voice_designer/VoiceDesignerVoiceEditPage";
import VoiceDesignerUseVoicePage from "./pages/voice_designer/VoiceDesignerUseVoicePage";
import PasswordResetEmailPage from "./pages/password_reset/PasswordResetEmailPage";
import PasswordResetVerificationPage from "./pages/password_reset/PasswordResetVerificationPage";
import InferenceJobsPage from "./pages/inference_jobs_page/InferenceJobsPage";
import ModerationJobControlPage from "./pages/moderation/job_control/ModerationJobControlPage";
import WeightPage from "./pages/weight/WeightPage";
import ExplorePage from "./pages/explore/ExplorePage";
import SearchPage from "./pages/search/SearchPage";
import WeightEditPage from "./pages/weight/WeightEditPage";
import FbxToGltfPage from "./pages/fbx_to_gltf/FbxToGltfPage";
import ScrollToTop from "./_common/ScrollToTop";
import TextToImagePage from "./pages/text_to_image/TextToImagePage";
import DevUpload from "./pages/dev_upload/DevUpload";
import DevMediaInput from "./pages/dev_upload/DevMediaInput";
import NewTTS from "./pages/audio_gen/tts/NewTTS";
import NewTrumpTTS from "./pages/audio_gen/tts/NewTrumpTTS";
import NewVC from "./pages/audio_gen/vc/NewVC";
import DashboardPage from "./pages/dashboard/DashboardPage";
import DevUploadAlt from "./pages/dev_upload/DevUploadAlt";
import ModerationTokenInfoPage from "./pages/moderation/ModerationTokenInfoPage";
import StyleVideo from "./pages/style-video";
import CreateBetaKeyPage from "./pages/beta_key/CreateBetaKeyPage";
import RedeemBetaKeyPage from "./pages/beta_key/RedeemBetaKeyPage";
import RedeemSuccessPage from "./pages/beta_key/RedeemSuccessPage";
import BetaKeysListPage from "./pages/beta_key/BetaKeysListPage";
import ProfilePageV3 from "./pages/profile/profile_view/ProfilePageV3";
import CreatorToolsPage from "./pages/creator_tools/CreatorToolsPage";
import WaitlistNextStepsPage from "./pages/waitlist_next_steps/WaitlistNextStepsPage";
import CreatorTypeformPage from "./pages/landing/storyteller/PostlaunchLanding/CreatorTypeformPage";
import SignUpSuccessPage from "./pages/beta_key/SignUpSuccessPage";
import StudioMobileCheckPage from "./pages/landing/storyteller/PostlaunchLanding/StudioMobileCheckPage";
import UploadNewTtsModelPage from "./pages/upload/UploadNewTtsModelPage";
import LivePortrait from "./pages/live_portrait/LivePortrait";
import CameraLivePortrait from "./pages/live_portrait/CameraLivePortrait";
import BetaLipSyncForm from "./pages/beta_products/BetaLipSyncForm";
import BetaLipSyncPage from "./pages/beta_products/BetaLipSyncPage";
import ToolsTestPage from "./pages/tools_test/ToolsTestPage";
import BetaVideoCompositorForm from "./pages/beta_products/BetaVideoCompositorForm";
import BetaVideoCompositorPage from "./pages/beta_products/BetaVideoCompositorPage";
import Beta3DVideoCompositorForm from "./pages/beta_products/Beta3DVideoCompositorForm";
import Beta3DVideoCompositorPage from "./pages/beta_products/Beta3DVideoCompositorPage";
import Lipsync from "./pages/lipsync/Lipsync";
import SetUsernamePage from "./pages/signup/SetUsernameModal";

// NB: Google Sign In requires a global javascript function
declare global {
  function handleGoogleCredentialResponse(args: any): void;
}

export default function PageContainer() {
  return (
    <>
      <ScrollToTop />
      <div id="wrapper" className="no-padding">
        <TopNav />

        <ProfileSidePanel />
        <Switch>
          <Route path="/" exact={true}>
            <LandingPage />
          </Route>

          <Route path="/firehose">
            <FirehoseEventListPage />
          </Route>

          <Route path="/news">
            <NewsPage />
          </Route>

          <Route path="/leaderboard">
            <LeaderboardPage />
          </Route>

          <Route path="/login">
            <LoginPage />
          </Route>

          <Route path="/password-reset/verify">
            <PasswordResetVerificationPage />
          </Route>

          <Route path="/password-reset">
            <PasswordResetEmailPage />
          </Route>

          <Route path="/profile/:username/edit">
            <ProfileEditFc />
          </Route>

          <Route path="/profile/:username/ban">
            <ProfileBanFc />
          </Route>

          <Route path="/profile/:username">
            <ProfilePageV3 />
          </Route>

          <Route path="/signup">
            <SignupPage />
          </Route>

          <Route exact path="/set-username">
            <SetUsernamePage />
          </Route>

          <Route path="/pricing" exact={true}>
            <PricingPage />
          </Route>

          <Route path="/checkout_success" exact={true}>
            <CheckoutSuccessPage />
          </Route>

          <Route path="/checkout_cancel" exact={true}>
            <CheckoutCancelPage />
          </Route>

          <Route path="/portal_success" exact={true}>
            <PortalSuccessPage />
          </Route>

          <Route path="/media/rename/:media_file_token">
            <MediaRenamePage />
          </Route>

          <Route path="/media/:token">
            <MediaPageSwitch />
          </Route>

          <Route path="/edit-cover-image/:token">
            <EditCoverImage />
          </Route>

          <Route path="/explore">
            <ExplorePage />
          </Route>

          <Route path="/weight/:weight_token/edit">
            <WeightEditPage />
          </Route>

          <Route
            path="/weight/:weight_token/:maybe_url_slug?"
            render={props => (
              <WeightPage key={props.match.params.weight_token} />
            )}
          />

          <Route path="/search/weights">
            <SearchPage />
          </Route>

          <Route path="/tts/result/:token/edit">
            <TtsResultEditPage />
          </Route>

          <Route path="/tts/result/:token/delete">
            <TtsResultDeletePage />
          </Route>

          <Route path="/tts/result/:token">
            <TtsResultViewPage />
          </Route>

          <Route path="/tts/:token/edit">
            <TtsModelEditPage />
          </Route>

          <Route path="/tts/:token/delete">
            <TtsModelDeletePage />
          </Route>

          <Route path="/tts/:token/categories">
            <TtsEditCategoriesPage />
          </Route>

          <Route path="/tts/:token">
            <TtsModelViewPage />
          </Route>

          <Route path="/w2l/result/:token/edit">
            <W2lResultEditPage />
          </Route>

          <Route path="/w2l/result/:token/delete">
            <W2lResultDeletePage />
          </Route>

          <Route path="/w2l/result/:token">
            <W2lResultViewPage />
          </Route>

          <Route path="/w2l/:templateToken/edit">
            <W2lTemplateEditPage />
          </Route>

          <Route path="/w2l/:templateToken/approval">
            <W2lTemplateApprovePage />
          </Route>

          <Route path="/w2l/:templateToken/delete">
            <W2lTemplateDeletePage />
          </Route>

          <Route path="/video">
            <W2lTemplateListPage />
          </Route>

          <Route path="/upload/tts">
            <UploadTtsModelPage />
          </Route>

          <Route path="/upload/tts_model">
            <UploadNewTtsModelPage />
          </Route>

          <Route path="/upload/sd">
            <UploadSdWeightPage />
          </Route>

          <Route path="/upload/lora">
            <UploadLoraWeightPage />
          </Route>

          <Route path="/upload/workflow">
            <UploadWorkflowPage />
          </Route>

          <Route path="/contribute">
            <ContributeIndexPage />
          </Route>

          <Route path="/moderation/user/list">
            <ModerationUserListFc />
          </Route>

          <Route path="/moderation/user_feature_flags/:username?">
            <ModerationUserFeatureFlagsPage />
          </Route>

          <Route path="/moderation/ip_bans/:ipAddress">
            <ModerationViewIpBanFc />
          </Route>

          <Route path="/moderation/ip_bans">
            <ModerationIpBanListFc />
          </Route>

          <Route path="/moderation/voice_stats">
            <ModerationVoiceStatsFc />
          </Route>

          <Route path="/moderation/job_stats">
            <ModerationJobStatsFc />
          </Route>

          <Route path="/moderation/job_control">
            <ModerationJobControlPage />
          </Route>

          <Route path="/moderation/token_info">
            <ModerationTokenInfoPage />
          </Route>

          <Route path="/moderation/tts_category/list">
            <ModerationTtsCategoryListPage />
          </Route>

          <Route path="/moderation/tts_category/edit/:token">
            <ModerationTtsCategoryEditPage />
          </Route>

          <Route path="/moderation/category/delete/:token">
            <ModerationCategoryDeletePage />
          </Route>

          <Route path="/moderation/approve/w2l_templates">
            <ModerationPendingW2lTemplatesFc />
          </Route>

          <Route path="/moderation">
            <ModerationPage />
          </Route>

          <Route exact={true} path="/clone">
            <VoiceCloneRequestPage />
          </Route>

          <Route path="/patrons">
            <PatronPage />
          </Route>

          <Route path="/product-usage">
            <ProductUsageInfoPage />
          </Route>

          <Route path="/voice-conversion/:token/delete">
            <VcModelDeletePage />
          </Route>

          <Route path="/voice-conversion/:token/edit">
            <VcModelEditPage />
          </Route>

          <Route path="/voice-conversion/:token">
            <VcModelViewPage />
          </Route>

          <Route path="/dashboard">
            <DashboardPage />
          </Route>

          <Route path="/about">
            <AboutPage />
          </Route>

          <Route path="/face-animator/:mediaToken?">
            <FaceAnimator />
          </Route>

          <Route path="/fbx-to-gltf/:mediaToken?">
            <FbxToGltfPage />
          </Route>

          <Route path="/commissions">
            <CommunityCommissionsPage />
          </Route>

          <Route path="/guide">
            <GuidePage />
          </Route>

          <Route path="/old">
            <VocodesPage />
          </Route>

          <Route path="/dev-upload">
            <DevUpload />
          </Route>

          <Route path="/dev-upload-alt">
            <DevUploadAlt />
          </Route>

          <Route path="/dev-media-input">
            <DevMediaInput />
          </Route>

          {/* NEW TTS PAGE */}
          <Route exact path="/tts">
            <NewTTS />
          </Route>

          {/* NEW VC PAGE */}
          <Route exact path="/voice-conversion">
            <NewVC />
          </Route>

          {/* NEW LIVE PORTRAIT PAGE */}
          <Route exact path="/ai-live-portrait">
            <LivePortrait />
          </Route>

          <Route exact path="/ai-lip-sync">
            <Lipsync />
          </Route>

          <Route exact path="/webcam-acting">
            <CameraLivePortrait />
          </Route>

          {/* Route for initial voice creation */}
          <Route exact path="/voice-designer/create">
            <VoiceDesignerFormPage />
          </Route>

          {/* Route for editing the dataset details */}
          <Route exact path="/voice-designer/dataset/:dataset_token/edit">
            <VoiceDesignerFormPage />
          </Route>

          {/* Route for handling dataset token for uploading samples */}
          <Route exact path="/voice-designer/dataset/:dataset_token/upload">
            <VoiceDesignerFormPage />
          </Route>

          <Route path="/voice-designer/voice/:voice_token/edit">
            <VoiceDesignerVoiceEditPage />
          </Route>

          <Route path="/voice-designer/voice/:voice_token">
            <VoiceDesignerUseVoicePage />
          </Route>

          <Route path="/inference-jobs-list">
            <InferenceJobsPage />
          </Route>

          <Route path="/voice-designer">
            <VoiceDesignerMainPage />
          </Route>

          <Route path="/style-video/:mediaToken?">
            <StyleVideo />
          </Route>

          <Route path="/video-mocap/:mediaToken?">
            <VideoMocap />
          </Route>

          <Route path="/text-to-image">
            <TextToImagePage />
          </Route>

          <Route path="/character/donald-trump">
            <NewTrumpTTS />
          </Route>

          <Route path="/beta/3d-video-compositor/form">
            <Beta3DVideoCompositorForm />
          </Route>

          <Route path="/beta/3d-video-compositor">
            <Beta3DVideoCompositorPage />
          </Route>

          <Route path="/beta/2d-video-compositor/form">
            <BetaVideoCompositorForm />
          </Route>

          <Route path="/beta/2d-video-compositor">
            <BetaVideoCompositorPage />
          </Route>

          <Route path="/beta/lip-sync/form">
            <BetaLipSyncForm />
          </Route>

          <Route path="/beta/lip-sync">
            <BetaLipSyncPage />
          </Route>

          <Route path="/beta/lip-sync/form">
            <BetaLipSyncForm />
          </Route>

          <Route path="/studio-mobile-check">
            <StudioMobileCheckPage />
          </Route>

          <Route path="/category/create">
            <CreateCategoryPage />
          </Route>

          <Route path="/creator-onboarding">
            <CreatorTypeformPage />
          </Route>

          <Route path="/welcome">
            <SignUpSuccessPage />
          </Route>

          <Route path="/beta-key/create">
            <CreateBetaKeyPage />
          </Route>

          <Route path="/beta-key/redeem/success">
            <RedeemSuccessPage />
          </Route>

          <Route path="/beta-key/redeem/:token?">
            <RedeemBetaKeyPage />
          </Route>

          <Route path="/beta-key/list">
            <BetaKeysListPage />
          </Route>

          {/* test page for tools */}
          <Route path="/dev/tools">
            <ToolsTestPage />
          </Route>

          <Route path="/tools">
            <CreatorToolsPage />
          </Route>

          <Route path="/waitlist-next-steps">
            <WaitlistNextStepsPage />
          </Route>
        </Switch>
      </div>
    </>
  );
}
