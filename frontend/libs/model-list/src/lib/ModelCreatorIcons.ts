import React, { ReactNode } from "react";
import { ModelCreator } from "./ModelCreator.js";

export const CREATOR_ICON_PATHS: Partial<Record<ModelCreator, string>> = {
  [ModelCreator.BlackForestLabs]:
    "/resources/images/services/blackforestlabs.svg",
  [ModelCreator.Kling]: "/resources/images/services/kling.svg",
  [ModelCreator.Midjourney]: "/resources/images/services/midjourney.svg",
  [ModelCreator.OpenAi]: "/resources/images/services/openai.svg",
  [ModelCreator.Bytedance]: "/resources/images/services/bytedance.svg",
  [ModelCreator.Google]: "/resources/images/services/google.svg",
};

export const getCreatorIconPath = (creator: ModelCreator): string | undefined =>
  CREATOR_ICON_PATHS[creator];

export const getCreatorIcon = (
  creator: ModelCreator,
  className = "h-4 w-4 invert"
): ReactNode | null => {
  const path = getCreatorIconPath(creator);
  if (!path) return null;
  return React.createElement("img", {
    src: path,
    alt: `${creator} logo`,
    className,
  });
};
