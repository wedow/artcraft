import {
  GetSessionInfo,
  GetSessionInfoIsOk,
  SessionInfoSuccessResponse,
} from "../api/session/GetSessionInfo";
import { StudioRolloutHostnameAllowed } from "../utils/StudioRolloutHostnameAllowed";

// A lot of the APIs return null or leave values absent.
// I need to pick a single strategy and stick with it.
type MaybeString = string | null | undefined;

/**
 * SessionWrapper can wrap each of the following states:
 *
 *   1) logged-in session
 *   2) non-existing session (logged out)
 *   3) lookup errors, server errors, 401, etc. (logged out)
 *
 * It then makes frontend permission checking simple.
 */
export class SessionWrapper {
  sessionStateResponse?: SessionInfoSuccessResponse;

  private constructor(sessionStateResponse?: SessionInfoSuccessResponse) {
    if (sessionStateResponse !== undefined) {
      this.sessionStateResponse = sessionStateResponse;
    }
  }

  // Perform lookup and return a wrapper of a valid, inval
  public static async lookupSession(): Promise<SessionWrapper> {
    let response = await GetSessionInfo();
    if (GetSessionInfoIsOk(response)) {
      return SessionWrapper.wrapResponse(response);
    } else {
      return SessionWrapper.emptySession();
    }
  }

  public static emptySession(): SessionWrapper {
    return new SessionWrapper();
  }

  public static wrapResponse(
    sessionStateResponse: SessionInfoSuccessResponse
  ): SessionWrapper {
    return new SessionWrapper(sessionStateResponse);
  }

  public isLoggedIn(): boolean {
    return this.sessionStateResponse?.logged_in || false;
  }

  // Feature flag rollout for Storyteller Studio
  // This depends on the domain name and the backend.
  public canAccessStudio(): boolean {
    //const hostnameAllowed = StudioRolloutHostnameAllowed();
    const userAllowed =
      this.sessionStateResponse?.user?.can_access_studio || 
      this.sessionStateResponse?.user?.maybe_feature_flags.includes("studio") ||
      false;
    //return hostnameAllowed && userAllowed;
    return userAllowed;
  }

  // Feature flag rollout for Video Style Transfer
  public canAccessVideoStyleTransfer(): boolean {
    return this.sessionStateResponse?.user?.maybe_feature_flags.includes("video_style_transfer") || false;
  }

  // Username is all lowercase
  public getUsername(): string | undefined {
    return this.sessionStateResponse?.user?.username;
  }

  // Display name has capitalization
  public getDisplayName(): string | undefined {
    return this.sessionStateResponse?.user?.display_name;
  }

  public getEmailGravatarHash(): string | undefined {
    return this.sessionStateResponse?.user?.email_gravatar_hash;
  }

  public canEditUserProfile(username: string): boolean {
    if (this.getUsername() === username) {
      return true;
    }
    return this.canEditOtherUsersProfiles();
  }

  public canEditMediaFileByUserToken(userToken: MaybeString): boolean {
    return (
      this.canEditOtherUsersTtsModels() || this.userTokenMatches(userToken)
    );
  }

  public canEditWeightByUserToken(userToken: MaybeString): boolean {
    return (
      this.canEditOtherUsersTtsModels() || this.userTokenMatches(userToken)
    );
  }

  public canEditTtsModelByUserToken(userToken: MaybeString): boolean {
    return (
      this.canEditOtherUsersTtsModels() || this.userTokenMatches(userToken)
    );
  }

  public canDeleteTtsModelByUserToken(userToken: MaybeString): boolean {
    return (
      this.canDeleteOtherUsersTtsModels() || this.userTokenMatches(userToken)
    );
  }

  public canDeleteTtsResultByUserToken(userToken: MaybeString): boolean {
    return (
      this.canDeleteOtherUsersTtsResults() || this.userTokenMatches(userToken)
    );
  }

  public canDeleteW2lTemplateByUserToken(userToken: MaybeString): boolean {
    return (
      this.canDeleteOtherUsersW2lTemplates() || this.userTokenMatches(userToken)
    );
  }

  public canDeleteW2lResultByUserToken(userToken: MaybeString): boolean {
    return (
      this.canDeleteOtherUsersW2lResults() || this.userTokenMatches(userToken)
    );
  }

  public canUseTts(): boolean {
    return this.sessionStateResponse?.user?.can_use_tts || true; // NB: Default true.
  }

  public canUseW2l(): boolean {
    return this.sessionStateResponse?.user?.can_use_w2l || true; // NB: Default true
  }

  public canUploadTtsModels(): boolean {
    return this.sessionStateResponse?.user?.can_upload_tts_models || false;
  }

  public canUploadW2lTemplates(): boolean {
    return this.sessionStateResponse?.user?.can_upload_w2l_templates || false;
  }

  public canBanUsers(): boolean {
    return this.sessionStateResponse?.user?.can_ban_users || false;
  }

  public canEditCategories(): boolean {
    // TODO / NB: There aren't fine-grained controls over categories.
    return this.canBanUsers();
  }

  public canApproveW2lTemplates(): boolean {
    return this.sessionStateResponse?.user?.can_approve_w2l_templates || false;
  }

  public canEditOtherUsersProfiles(): boolean {
    return (
      this.sessionStateResponse?.user?.can_edit_other_users_profiles || false
    );
  }

  public canEditOtherUsersTtsModels(): boolean {
    return (
      this.sessionStateResponse?.user?.can_edit_other_users_tts_models || false
    );
  }

  public canDeleteOtherUsersTtsModels(): boolean {
    return (
      this.sessionStateResponse?.user?.can_delete_other_users_tts_models ||
      false
    );
  }

  public canDeleteOtherUsersTtsResults(): boolean {
    return (
      this.sessionStateResponse?.user?.can_delete_other_users_tts_results ||
      false
    );
  }

  public canDeleteOtherUsersW2lTemplates(): boolean {
    return (
      this.sessionStateResponse?.user?.can_delete_other_users_w2l_templates ||
      false
    );
  }

  public canDeleteOtherUsersW2lResults(): boolean {
    return (
      this.sessionStateResponse?.user?.can_delete_other_users_w2l_results ||
      false
    );
  }

  public canEditTtsResultAsUserOrMod(creatorUserToken: MaybeString): boolean {
    if (this.userTokenMatches(creatorUserToken)) {
      return true;
    }
    return this.canDeleteOtherUsersTtsResults(); // TODO: There is no granular permission for this yet.
  }

  public deleteTtsResultAsMod(creatorUserToken: MaybeString): boolean {
    if (this.userTokenMatches(creatorUserToken)) {
      return true;
    }
    return this.canDeleteOtherUsersTtsResults();
  }

  public deleteTtsModelAsMod(creatorUserToken: MaybeString): boolean {
    if (this.userTokenMatches(creatorUserToken)) {
      return true;
    }
    return this.canDeleteOtherUsersTtsModels();
  }

  public canEditW2lResultAsUserOrMod(creatorUserToken: MaybeString): boolean {
    if (this.userTokenMatches(creatorUserToken)) {
      return true;
    }
    return this.canDeleteOtherUsersW2lResults(); // TODO: There is no granular permission for this yet.
  }

  public canDeleteW2lResultAsUserOrMod(creatorUserToken: MaybeString): boolean {
    if (this.userTokenMatches(creatorUserToken)) {
      return true;
    }
    return this.canDeleteOtherUsersW2lResults();
  }

  public userTokenMatches(otherUserToken: MaybeString): boolean {
    // Default to false if user token on either side is falsey.
    if (!otherUserToken) {
      return false;
    }
    const ourUserToken = this.sessionStateResponse?.user?.user_token;
    if (!ourUserToken) {
      return false;
    }
    return ourUserToken === otherUserToken;
  }
}
