
/** Centralize URL configurations (apart from bindings) */
class WebUrl {

  // Main

  static indexPage(): string {
    return '/';
  }

  // Login and signup flow

  static signupPage() : string {
    return '/signup';
  }

  static signupPageWithPurchaseIntent(pricingPlanKey: string) : string {
    return `/signup?sub=${pricingPlanKey}`;
  }

  static loginPage() : string {
    return '/login';
  }

  // Pricing page

  static pricingPage(): string {
    return '/pricing';
  }

  static pricingPageWithReferer(fromPage: string): string {
    // NB: This is to more easily track the referer page in Google Analytics
    return `/pricing?from=${fromPage}`;
  }

  // Standalone pages

  static aboutUsPage(): string {
    return '/about';
  }

  static termsPage(): string {
    return '/terms';
  }

  static privacyPage(): string {
    return '/privacy';
  }

  static patronsPage(): string {
    return '/patrons';
  }

  static cloneRequestPage(): string {
    return '/clone';
  }

  static newsPage(): string {
    return '/news';
  }

  // Other domains

  static developerDocs(): string {
    return 'https://docs.fakeyou.com/';
  }

  // TTS model links

  static ttsModelPage(modelToken: string): string {
    return `/tts/${modelToken}`;
  }

  static ttsModelEditPage(modelToken: string): string {
    return `/tts/${modelToken}/edit`;
  }

  static ttsModelEditCategoriesPage(modelToken: string): string {
    return `/tts/${modelToken}/categories`;
  }

  static ttsModelDeletePage(modelToken: string): string {
    return `/tts/${modelToken}/delete`;
  }

  static ttsResultPage(resultToken: string): string {
    return `/tts/result/${resultToken}`;
  }

  static ttsResultEditPage(resultToken: string): string {
    return `/tts/result/${resultToken}/edit`;
  }

  static ttsResultDeletePage(resultToken: string): string {
    return `/tts/result/${resultToken}/delete`;
  }

  // W2L template links

  static w2lListPage(): string {
    return '/video';
  }

  static w2lTemplatePage(templateToken: string): string {
    return `/w2l/${templateToken}`;
  }

  static w2lTemplateEditPage(templateToken: string): string {
    return `/w2l/${templateToken}/edit`;
  }

  static w2lTemplateApprovalPage(templateToken: string): string {
    return `/w2l/${templateToken}/approval`;
  }

  static w2lTemplateDeletePage(templateToken: string): string {
    return `/w2l/${templateToken}/delete`;
  }

  static w2lResultPage(resultToken: string): string {
    return `/w2l/result/${resultToken}`;
  }

  static w2lResultEditPage(resultToken: string): string {
    return `/w2l/result/${resultToken}/edit`;
  }

  static w2lResultDeletePage(resultToken: string): string {
    return `/w2l/result/${resultToken}/delete`;
  }

  // User links

  static userProfilePage(userDisplayName: string): string {
    return `/profile/${userDisplayName}`;
  }

  static userProfileEditPage(userDisplayName: string): string {
    return `/profile/${userDisplayName}/edit`;
  }

  static userProfileBanPage(userDisplayName: string): string {
    return `/profile/${userDisplayName}/ban`;
  }

  // Contribute 

  static contributePage(): string {
    return '/contribute';
  }

  static createCategoryPage(): string {
    return '/category/create';
  }

  // Moderation links

  static moderationMain(): string {
    return '/moderation';
  }

  static moderationTtsCategoryList(): string {
    return '/moderation/tts_category/list';
  }

  static moderationTtsCategoryEdit(categoryToken: string): string {
    return `/moderation/tts_category/edit/${categoryToken}`;
  }

  static moderationCategoryDeletePage(categoryToken: string): string {
    return `/moderation/category/delete/${categoryToken}`;
  }
}

export { WebUrl }
