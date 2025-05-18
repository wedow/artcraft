import { computed, signal } from "@preact/signals-react";
import { UserInfo } from "@ApiManager/models/Users";
import { ActiveSubscriptions } from "@ApiManager/models/Billing";
import { LoyaltyProgram } from "@ApiManager/enums/Billing";
import { USER_FEATURE_FLAGS } from "@ApiManager/enums/UserFeatures";

import { AUTH_STATUS } from "./enums";

const status = signal<AUTH_STATUS>(AUTH_STATUS.INIT);
const userInfo = signal<UserInfo | undefined>(undefined);
const activeSubs = signal<ActiveSubscriptions | undefined>(undefined);

const canUpload3D = computed(() => {
  if (!userInfo.value || !userInfo.value.maybe_feature_flags) {
    return undefined;
  }
  return userInfo.value.maybe_feature_flags.includes(
    USER_FEATURE_FLAGS.UPLOAD_3D,
  );
});

const hasAccess = computed(() => {
  if (
    userInfo.value === undefined ||
    userInfo.value.can_access_studio === undefined
  ) {
    return undefined;
  }
  return userInfo.value.can_access_studio;
});

const hasPremium = computed(() => {
  if (activeSubs.value === undefined) {
    return undefined;
  }
  if (
    activeSubs.value.active_subscriptions.length > 0 ||
    activeSubs.value.maybe_loyalty_program === LoyaltyProgram.CONTRIBUTOR
  ) {
    return true;
  }
  return false;
});

export const signals = {
  status,
  userInfo,
  activeSubs,
  canUpload3D,
  hasAccess,
  hasPremium,
};
