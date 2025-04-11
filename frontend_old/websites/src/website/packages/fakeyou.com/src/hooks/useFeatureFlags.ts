import { featureFlags, isVideoToolsEnabled } from "../config/featureFlags";

export const useFeatureFlags = () => {
  return {
    isVideoToolsEnabled: isVideoToolsEnabled,
    featureFlags,
  };
};
