import { AUTH_STATUS } from "./enums";
import { UserInfo } from "~/Classes/ApiManager/models/Users";
import { ActiveSubscriptions } from "@ApiManager/models/Billing";

import { signals } from "./signals";

export const updateAuthStatus = (newStatus: AUTH_STATUS) => {
  signals.status.value = newStatus;
};

export const updateUserInfo = (
  newInfo: UserInfo | undefined,
  flush?: boolean,
) => {
  if (newInfo && !flush) {
    //case of updating UserInfo partly
    signals.userInfo.value = {
      ...signals.userInfo.value,
      ...newInfo,
    };
  } else {
    //case of setting a new User
    //case of deleting userInfo
    signals.userInfo.value = newInfo;
  }
};
export const updateActiveSubscriptions = (
  activeSubs: ActiveSubscriptions | undefined,
) => {
  signals.activeSubs.value = activeSubs;
};

// this function is not exposed, only the logout function is
export const setLogoutStates = () => {
  updateAuthStatus(AUTH_STATUS.LOGGED_OUT);
  updateUserInfo(undefined);
  updateActiveSubscriptions(undefined);
  // flushAllBackgroundLoadedMedia();
};
