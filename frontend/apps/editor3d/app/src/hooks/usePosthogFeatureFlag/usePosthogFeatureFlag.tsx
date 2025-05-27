import { FeatureFlags } from "~/enums/FeatureFlags";

export const usePosthogFeatureFlag = (flag: FeatureFlags): boolean => {
  return true; // TODO(bt,2025-05-27): Find a replacement for Posthog feature flags.
};
