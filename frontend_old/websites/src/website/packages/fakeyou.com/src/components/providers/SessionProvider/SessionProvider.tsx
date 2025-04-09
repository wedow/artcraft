import React, { createContext, useContext, useEffect, useMemo } from "react";
import ModalLayer from "components/providers/ModalProvider/ModalLayer";
import { ModalConfig, useModalState } from "hooks";
import AccountModal from "components/layout/AccountModal";
import { StudioNotAvailable } from "v2/view/_common/StudioNotAvailable";
import { StudioRolloutHostnameAllowed } from "@storyteller/components/src/utils/StudioRolloutHostnameAllowed";
import { SessionWrapper } from "@storyteller/components/src/session/SessionWrapper";
import { SessionSubscriptionsWrapper } from "@storyteller/components/src/session/SessionSubscriptionsWrapper";
import { StyleVideoNotAvailable } from "v2/view/_common/StyleVideoNotAvailable";
import { GetAppStateResponse } from "@storyteller/components/src/api/app_state/GetAppState";
import {
  AppStateContext,
  emptyAppState,
} from "components/providers/AppStateProvider";
import { isDevelopment } from "utils/environment";

declare global {
  interface Window {
    removeAdsense?: () => void;
    adsbygoogle?: any[];
  }
}

export interface AccountModalMessages {
  loginMessage?: string;
  signupMessage?: string;
}

export interface AccountModalEvents {
  onModalClose?: () => void;
  onModalOpen?: () => void;
}

export interface SessionUtilities {
  queryAppState: () => void;
}

interface SessionContextType extends SessionUtilities {
  appState: GetAppStateResponse;
  canAccessStudio: () => boolean;
  canEditTtsModel: (creatorUserToken: string) => boolean;
  canEditMediaFile: (creatorUserToken?: string) => boolean;
  canBanUsers: () => boolean;
  loggedInOrModal: (
    acctMsgs: AccountModalMessages,
    cfg?: AccountModalEvents
  ) => boolean;
  loggedIn: boolean;
  modal: {
    close: () => void;
    open: (cfg: ModalConfig) => void;
  };
  sessionFetched: boolean;
  sessionSubscriptions?: SessionSubscriptionsWrapper;
  sessionWrapper: SessionWrapper;
  studioAccessCheck: (x: any) => any;
  styleVideoAccessCheck: (x: any) => any;
  user?: any;
  userTokenMatch: (token: string) => boolean;
}

interface SessionProviderProps {
  children?: any;
}

// Functions are initially No-ops/dummies so that they are never undefined and never have to be called conditionally.
// These functions will never actually fire because they are immediately redefined in the provider below,
// as they must be as they utilize the provider's state.

// const thingy = new SessionWrapper()

export const SessionContext = createContext<SessionContextType>({
  appState: emptyAppState,
  canAccessStudio: () => false,
  canEditTtsModel: () => false,
  canEditMediaFile: () => false,
  canBanUsers: () => false,
  loggedInOrModal: () => false,
  loggedIn: false,
  sessionFetched: false,
  studioAccessCheck: () => null,
  styleVideoAccessCheck: () => null,
  modal: {
    close: () => {},
    open: () => {},
  },
  userTokenMatch: () => false,
  queryAppState: () => {},
  sessionWrapper: SessionWrapper.emptySession(),
});

export default function SessionProvider({ children }: SessionProviderProps) {
  const { appState, sessionSubscriptions, sessionWrapper, queryAppState } =
    useContext(AppStateContext);

  const sessionResponse = useMemo(
    () =>
      sessionWrapper?.sessionStateResponse || {
        logged_in: false,
        user: null,
      },
    [sessionWrapper?.sessionStateResponse]
  );

  const { logged_in: loggedIn, user } = sessionResponse;

  const { close, killModal, modalOpen, modalState, onModalCloseEnd, open } =
    useModalState({});

  const loggedInOrModal = (
    accountModalMessages: AccountModalMessages,
    events?: AccountModalEvents
  ) => {
    if (user) {
      return true;
    } else {
      open({
        component: AccountModal,
        scroll: true,
        width: "small",
        props: { ...accountModalMessages },
        ...events,
      });
      return false;
    }
  };
  // NB: Since user token matching is used for ownership permission checking, neither may be undefined!
  const userTokenMatch = (otherUserToken?: string) =>
    user?.user_token !== undefined &&
    otherUserToken !== undefined &&
    user.user_token === otherUserToken;
  const canEditTtsModel = (userToken: string) =>
    user?.can_delete_other_users_tts_models || userTokenMatch(userToken);
  const canEditMediaFile = (userToken?: string) =>
    user?.can_delete_other_users_tts_results || userTokenMatch(userToken);
  const canBanUsers = () => user?.can_ban_users || false;
  const canAccessStudio = () => {
    const hostnameAllowed = StudioRolloutHostnameAllowed();
    const userAllowed =
      !!user?.can_access_studio ||
      !!user?.maybe_feature_flags.includes("studio");
    return hostnameAllowed && userAllowed;
  };

  const studioAccessCheck = (content: React.ElementType) =>
    canAccessStudio() ? content : <StudioNotAvailable />;

  const styleVideoAccessCheck = (content: React.ElementType) =>
    canAccessStudio() ? content : <StyleVideoNotAvailable />;

  const modal = { close, open };

  // Adsense logic for paid users
  useEffect(() => {
    const shouldShowAds = () => {
      if (isDevelopment()) return false;
      const isLoggedIn = !!user;
      const hasPaidFeatures =
        sessionSubscriptions?.hasPaidFeatures?.() ?? false;
      return !isLoggedIn || !hasPaidFeatures;
    };

    let timeoutId: NodeJS.Timeout;

    try {
      // Only run if session is fully loaded
      if (sessionResponse && appState.success && !shouldShowAds()) {
        // Safely remove adsense script and ads
        if (typeof window !== "undefined" && window?.removeAdsense) {
          window.removeAdsense();
        }

        // Remove the padding that was added for ads
        timeoutId = setTimeout(() => {
          if (document?.body) {
            document.body.style.paddingBottom = "0";
            document.body.style.paddingTop = "0";
          }
        }, 150);
      }
    } catch (error) {
      console.error("Error in ads effect:", error);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessionResponse, sessionSubscriptions, user, appState.success]);

  return (
    <SessionContext.Provider
      {...{
        value: {
          appState,
          canAccessStudio,
          canEditTtsModel,
          canEditMediaFile,
          canBanUsers,
          loggedInOrModal,
          loggedIn,
          modal,
          queryAppState,
          sessionFetched: appState.success,
          sessionSubscriptions,
          sessionWrapper,
          studioAccessCheck,
          styleVideoAccessCheck,
          user,
          userTokenMatch,
        },
      }}
    >
      {children}
      <ModalLayer
        {...{
          content: modalState?.component,
          contentProps: modalState?.props,
          close,
          // debug: "SessionProvider",
          killModal,
          lockTint: modalState?.lockTint,
          modalOpen,
          onModalCloseEnd,
          scroll: modalState?.scroll,
          width: modalState?.width,
        }}
      />
    </SessionContext.Provider>
  );
}
