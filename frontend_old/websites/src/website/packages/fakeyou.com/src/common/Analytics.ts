import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

/**
 * Send Analytics to Google Analytics.
 *
 * Keeping track of events in a singular space lets us easily update them and keep track of what we're analyzing at a high level.
 *
 * Currently we use Universal Analytics (UA), but support for that ends July 2023. We need to update to Google Analytics 4 (GA4).
 *
 * Here is some reading material:
 *  - [Events usage in UA - really good resource on how to bucket events](https://support.google.com/analytics/answer/1033068)
 *  - [GTag events for multiple Google products: UA, GA4, etc.](https://developers.google.com/tag-platform/devguides/events)
 *  - [Sending events to both UA and GA4](https://support.google.com/analytics/answer/11091026)
 */

class Analytics {
  // NB: DO NOT CHANGE!
  // These should be stable values for analytics.
  private static readonly ACCOUNT = "account";
  private static readonly PREMIUM = "premium";
  private static readonly TTS = "tts";
  private static readonly TTS_MODEL = "tts_model";
  private static readonly TTS_RESULT = "tts_result";
  private static readonly UI = "ui";
  private static readonly TOPBAR = "topbar";
  private static readonly VOICE_CONVERSION = "voice_conversion";

  // ========== USER ==========

  static accountSignupAttempt() {
    Analytics.sendCategorizedEvent(this.ACCOUNT, 'signup_attempt');
  }

  static accountSignupComplete() {
    Analytics.sendCategorizedEvent(this.ACCOUNT, 'signup_complete');
  }

  static accountLoginAttempt() {
    Analytics.sendCategorizedEvent(this.ACCOUNT, 'login_attempt');
  }

  static accountLoginSuccess() {
    Analytics.sendCategorizedEvent(this.ACCOUNT, 'login_success');
  }

  static accountLogout() {
    Analytics.sendCategorizedEvent(this.ACCOUNT, 'logout');
  }

  // ========== PREMIUM ==========

  static premiumSelectPlanPlus() {
    Analytics.sendCategorizedEvent(this.PREMIUM, 'select_plan_plus');
  }

  static premiumSelectPlanPro() {
    Analytics.sendCategorizedEvent(this.PREMIUM, 'select_plan_pro');
  }

  static premiumSelectPlanElite() {
    Analytics.sendCategorizedEvent(this.PREMIUM, 'select_plan_elite');
  }

  static premiumSelectUnsubscribe() {
    Analytics.sendCategorizedEvent(this.PREMIUM, 'select_unsubscribe');
  }

  static premiumForwardToStripeCheckout() {
    Analytics.sendCategorizedEvent(this.PREMIUM, 'forward_to_stripe_checkout');
  }

  static premiumForwardToStripePortal() {
    Analytics.sendCategorizedEvent(this.PREMIUM, 'forward_to_stripe_portal');
  }

  static premiumBounceToSignup() {
    Analytics.sendCategorizedEvent(this.PREMIUM, 'bounce_to_signup');
  }

  // ========== TTS ==========

  static ttsGenerate(modelToken: string, ttsLength: number) {
    Analytics.sendCategorizedEvent(this.TTS, 'generate_tts', modelToken, ttsLength);
  }

  static ttsClear(modelToken?: string) {
    Analytics.sendCategorizedEvent(this.TTS, 'clear', modelToken);
  }
  
  static ttsClickResultInlinePlay() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_tts_result_inline_play');
  }

  static ttsClickResultLink() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_tts_result_link');
  }

  static ttsClickModelDetailsLink() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_model_details_link');
  }

  static ttsClickModelCreatorLink() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_model_creator_link');
  }

  static ttsClickHeroViewProfile() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_hero_view_profile');
  }

  static ttsClickHeroViewPricing() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_hero_view_pricing');
  }

  static ttsClickHeroVoiceClone() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_hero_voice_clone');
  }

  static ttsClickHeroUpgradePlan() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_hero_upgrade_plan');
  }

  static ttsClickHeroSignup() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_hero_signup');
  }

  static ttsSelectVoiceFromCategory() {
    Analytics.sendCategorizedEvent(this.TTS, 'select_voice_from_category');
  }

  static ttsSelectVoiceFromSearchResult() {
    Analytics.sendCategorizedEvent(this.TTS, 'select_voice_from_search_result');
  }

  static ttsClickSelectCategory() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_select_category');
  }

  static ttsOpenCategorySelectMenu() {
    Analytics.sendCategorizedEvent(this.TTS, 'open_category_select_menu');
  }

  static ttsOpenLanguageSelectMenu() {
    Analytics.sendCategorizedEvent(this.TTS, 'open_language_select_menu');
  }

  static ttsOpenPrimaryVoiceSelectMenu() {
    Analytics.sendCategorizedEvent(this.TTS, 'open_primary_voice_select_menu');
  }

  static ttsOpenScopedVoiceSelectMenu() {
    Analytics.sendCategorizedEvent(this.TTS, 'open_scoped_voice_select_menu');
  }

  static ttsOpenExploreVoicesModal() {
    Analytics.sendCategorizedEvent(this.TTS, 'open_explore_voices_modal');
  }

  static ttsClickRandomVoice() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_random_voice');
  }

  static ttsClickTextInputBox() {
    Analytics.sendCategorizedEvent(this.TTS, 'click_text_input_box');
  }

  static ttsTooSlowUpgradePremium() {
    Analytics.sendCategorizedEvent(this.TTS, 'tts_too_slow_upgrade_premium');
  }

  // ========== TTS MODEL PAGE ==========

  static ttsModelPageClickShareLink() {
    Analytics.sendCategorizedEvent(this.TTS_MODEL, 'click_share_link');
  }

  static ttsModelPageClickShareFacebook() {
    Analytics.sendCategorizedEvent(this.TTS_MODEL, 'click_share_facebook');
  }

  static ttsModelPageClickShareReddit() {
    Analytics.sendCategorizedEvent(this.TTS_MODEL, 'click_share_reddit');
  }

  static ttsModelPageClickShareTwitter() {
    Analytics.sendCategorizedEvent(this.TTS_MODEL, 'click_share_twitter');
  }

  static ttsModelPageClickShareWhatsapp() {
    Analytics.sendCategorizedEvent(this.TTS_MODEL, 'click_share_whatsapp');
  }

  // ========== TTS RESULT PAGE ==========

  static ttsResultPageClickPlayPauseToggle() {
    Analytics.sendCategorizedEvent(this.TTS_RESULT, 'click_play_pause_toggle');
  }

  static ttsResultPageClickDownload() {
    Analytics.sendCategorizedEvent(this.TTS_RESULT, 'click_download');
  }

  static ttsResultPageClickRegisterToDownload() {
    Analytics.sendCategorizedEvent(this.TTS_RESULT, 'click_register_to_download');
  }

  static ttsResultPageClickShareLink() {
    Analytics.sendCategorizedEvent(this.TTS_RESULT, 'click_share_link');
  }

  static ttsResultPageClickShareFacebook() {
    Analytics.sendCategorizedEvent(this.TTS_RESULT, 'click_share_facebook');
  }

  static ttsResultPageClickShareReddit() {
    Analytics.sendCategorizedEvent(this.TTS_RESULT, 'click_share_reddit');
  }

  static ttsResultPageClickShareTwitter() {
    Analytics.sendCategorizedEvent(this.TTS_RESULT, 'click_share_twitter');
  }

  static ttsResultPageClickShareWhatsapp() {
    Analytics.sendCategorizedEvent(this.TTS_RESULT, 'click_share_whatsapp');
  }

  // ========== VOICE CONVERSION ==========

  static ttsOpenPrimaryVoiceConversionSelectMenu() {
    Analytics.sendCategorizedEvent(this.VOICE_CONVERSION, 'open_primary_voice_select_menu');
  }

  static voiceConversionGenerate(modelToken: string) {
    Analytics.sendCategorizedEvent(this.VOICE_CONVERSION, 'generate_vc', modelToken);
  }

  static voiceConversionClickDownload() {
    Analytics.sendCategorizedEvent(this.VOICE_CONVERSION, "click_download");
  }

  // ========== TOPBAR ==========

  static topbarClickPricing() {
    Analytics.sendCategorizedEvent(this.TOPBAR, "click_pricing");
  }

  // ========== (impl) ==========

  private static sendEvent(actionName: string, eventLabel?: string, value?: number) {
    gtag('event', actionName, {
      'event_category': undefined,
      'event_label': eventLabel,
      'value': value,
    });
  }

  private static sendCategorizedEvent(eventCategory: string, actionName: string, eventLabel?: string, value?: number) {
    PosthogClient.recordAction(actionName);

    gtag('event', actionName, {
      'event_category': eventCategory,
      'event_label': eventLabel,
      'value': value,
    });
  }
}

export { Analytics }