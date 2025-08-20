import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getCreatorIcon,
  getModelsByCategory,
  getInstructiveImageEditModels,
  IMAGE_EDITOR_PAGE_MODELS,
  TEXT_TO_IMAGE_PAGE_MODELS,
} from "@storyteller/model-list";

export type ModelList = Omit<PopoverItem, "selected">[];

const withIcon = (creatorIcon: any, fallback: any) => creatorIcon || fallback;

const buildItems = (
  models: {
    label: string;
    description?: string;
    badges?: { label: string }[];
    info: { creator: any };
  }[],
  fallbackIcon: any
) =>
  models.map((m) => ({
    label: m.label,
    icon: withIcon(getCreatorIcon((m as any).info.creator), fallbackIcon),
    description: (m as any).description,
    badges: (m as any).badges?.map((b: any) => ({
      label: b.label,
      icon: <FontAwesomeIcon icon={faClock} />,
    })),
    modelInfo: (m as any).info,
  }));

const videoModels = getModelsByCategory("video");
const instructiveModels = getInstructiveImageEditModels();

export const allModels = {
  video: buildItems(
    videoModels as any,
    <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
  ),
  instructiveImageEdits: buildItems(
    instructiveModels as any,
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  ),
};

export const videoGenerationModels: ModelList = allModels.video;
export const instructiveImageEditModels: ModelList =
  allModels.instructiveImageEdits;

export const TEXT_TO_IMAGE_PAGE_MODEL_LIST : ModelList = buildItems(
  TEXT_TO_IMAGE_PAGE_MODELS as any,
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

export const IMAGE_EDITOR_PAGE_MODEL_LIST : ModelList = buildItems(
  IMAGE_EDITOR_PAGE_MODELS as any,
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);
