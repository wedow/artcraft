import React, { createContext, useEffect, useState } from "react";
import { SessionWrapper } from "@storyteller/components/src/session/SessionWrapper";
import { SessionSubscriptionsWrapper } from "@storyteller/components/src/session/SessionSubscriptionsWrapper";
import Cookies from "universal-cookie";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import deepEqual from "deep-equal";
import { i18n2 } from "App";
import {
  AvailableLanguageKey,
  AVAILABLE_LANGUAGE_MAP,
  ENGLISH_LANGUAGE,
} from "_i18n/AvailableLanguageMap";

import {
  GetAppState,
  GetAppStateResponse,
} from "@storyteller/components/src/api/app_state/GetAppState";
import { useInterval } from "hooks";

interface AppStatusProviderProps {
  children: any;
  debug?: string;
}

interface CurrentAppState {
  appState: GetAppStateResponse;
  sessionWrapper: SessionWrapper;
  sessionSubscriptions: SessionSubscriptionsWrapper;
}

interface AppStateUtilities extends CurrentAppState {
  queryAppState: () => void;
}

export const emptyAppState: GetAppStateResponse = {
  is_banned: false,
  is_logged_in: false,
  locale: {
    full_language_tags: ["en-US", "en"],
    language_codes: ["en", "en"],
  },
  maybe_alert: null,
  maybe_premium: null,
  maybe_user_info: null,
  permissions: {
    feature_flags: [],
    is_moderator: false,
    legacy_permission_flags: {
      can_approve_w2l_templates: false,
      can_ban_users: false,
      can_delete_other_users_tts_models: false,
      can_delete_other_users_tts_results: false,
      can_delete_other_users_w2l_results: false,
      can_delete_other_users_w2l_templates: false,
      can_delete_own_account: false,
      can_delete_own_tts_models: false,
      can_delete_own_tts_results: false,
      can_delete_own_w2l_results: false,
      can_delete_own_w2l_templates: false,
      can_delete_users: false,
      can_edit_other_users_profiles: false,
      can_edit_other_users_tts_models: false,
      can_edit_other_users_w2l_templates: false,
      can_upload_tts_models: false,
      can_upload_w2l_templates: false,
      can_use_tts: false,
      can_use_w2l: false,
    },
  },
  server_info: {
    build_sha: "",
    build_sha_short: "",
    hostname: "",
  },
  success: false,
  refresh_interval_millis: 60000,
};

const emptyState: CurrentAppState = {
  appState: emptyAppState,
  sessionWrapper: SessionWrapper.emptySession(),
  sessionSubscriptions: SessionSubscriptionsWrapper.emptySubscriptions(),
};

export const AppStateContext = createContext<AppStateUtilities>({
  ...emptyState,
  queryAppState: () => {},
});

export default function AppStateProvider({
  children,
  debug,
}: AppStatusProviderProps) {
  const [stateAndWrappers, stateAndWrappersSet] =
    useState<CurrentAppState>(emptyState);
  const [keepAlive, keepAliveSet] = useState(true);

  const onTick = () => {
    if (debug) {
      console.log("💾 App State Loop", stateAndWrappers);
    }
    GetAppState("", {}).then((res: GetAppStateResponse) => {
      if (res.success) {
        if (debug) {
          console.log("App State fetch success ✅", res);
        }

        // compare response and state without server info as server host can change
        // that way we only write state when there are meaningful state updates

        const { server_info: unusedEventInfo, ...oldState } =
          stateAndWrappers.appState;
        const { server_info: unusedResInfo, ...updatedState } = res;
        const isUpdated = !deepEqual(oldState, updatedState);

        if (isUpdated) {
          const newSessionWrapper = SessionWrapper.wrapResponse({
            success: true,
            logged_in: res.is_logged_in,
            ...(res.is_logged_in && res.maybe_user_info && res.permissions
              ? {
                  user: {
                    user_token: res.maybe_user_info.user_token,
                    username: res.maybe_user_info.username,
                    display_name: res.maybe_user_info.display_name,
                    email_gravatar_hash: res.maybe_user_info.gravatar_hash,
                    can_access_studio:
                      res.permissions.feature_flags.includes("studio"),
                    maybe_feature_flags: res.permissions.feature_flags,
                    ...res.permissions.legacy_permission_flags,
                  },
                }
              : { user: null }),
          });

          const newSubsciptions = SessionSubscriptionsWrapper.wrapResponse({
            success: true,
            active_subscriptions: res.maybe_premium
              ? res.maybe_premium.active_subscriptions
              : [],
            ...(res.maybe_premium?.maybe_loyalty_program
              ? {
                  maybe_loyalty_program:
                    res.maybe_premium.maybe_loyalty_program,
                }
              : {}),
          });

          const cookies = new Cookies();

          stateAndWrappersSet({
            appState: res,
            sessionWrapper: newSessionWrapper,
            sessionSubscriptions: newSubsciptions,
          });

          keepAliveSet(false);

          if (res.maybe_user_info) {
            if (debug) {
              console.log("🌻 Logged in");
            }
            PosthogClient.enablePosthog();
            PosthogClient.setUsername(res.maybe_user_info.username);
            cookies.set("logged_in_username", res.maybe_user_info.username, {
              path: "/",
              expires: new Date(Date.now() + 3 * 86400000),
            });
            // @ts-ignore
            window.dataLayer.push({
              user_id: res.maybe_user_info.username,
            });
          } else {
            if (debug) {
              console.log("🥀 Logged out", res);
            }
            cookies.remove("logged_in_username", { path: "/" });
          }

          // this is just a copy/paste of code from App.tsx. I'll probably rewrite it whem I understand it more -V

          let preferredLanguage = ENGLISH_LANGUAGE;

          for (let languageCode of res.locale.language_codes) {
            let maybeLanguage =
              AVAILABLE_LANGUAGE_MAP[languageCode as AvailableLanguageKey];

            if (maybeLanguage !== undefined) {
              preferredLanguage = maybeLanguage;
              break;
            }
          }

          i18n2.changeLanguage(preferredLanguage.languageCode);
        }
      }
    });
  };

  const queryAppState = () => {
    if (debug) {
      console.log("❓ Manual App State query");
    }
    onTick();
  };

  useInterval({
    debug,
    interval: stateAndWrappers.appState.refresh_interval_millis,
    onTick,
    locked: !keepAlive,
  });

  useEffect(() => {
    if (!keepAlive) {
      keepAliveSet(true);
    }
  }, [keepAlive]);

  return (
    <AppStateContext.Provider
      {...{
        value: { ...stateAndWrappers, queryAppState },
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}
