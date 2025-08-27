import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getCreatorIcon,
  Model,
  VIDEO_MODELS,
  IMAGE_MODELS,
} from "@storyteller/model-list";
import { ModelTag } from "@storyteller/model-list";

export type ModelList = Omit<PopoverItem, "selected">[];

const withIcon = (creatorIcon: any, fallback: any) => creatorIcon || fallback;

const buildItems2 = (
  models: Model[],
  fallbackIcon: any
) =>
  models.map((model : Model) => ({
    label: model.selectorName,
    icon: withIcon(getCreatorIcon(model.creator), fallbackIcon),
    description: model.selectorDescription,
    badges: model.toLegacyBadges()?.map((b) => ({
      label: b.label,
      icon: <FontAwesomeIcon icon={faClock} />,
    })),
    modelConfig: model.toLegacyModelConfig(), // Access to full object.
    model: model,
  }));

/**
 * OLD MODEL LISTS
 */ 

/**
 * IN-PROGRESS MIGRATION (messy for now)
 * We're gradually going to phase out ModelList, ModelConfig, etc.
 * We won't index by name, but rather id, or simply will always have full 
 * access to the object directly.
 */ 

export const CANVAS_2D_PAGE_MODEL_LIST : ModelList = buildItems2(
  IMAGE_MODELS.filter((m) => m.tags?.includes(ModelTag.InstructiveEdit)), // TODO: Just attach which page we want to see it on.
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

export const STAGE_3D_PAGE_MODEL_LIST : ModelList = buildItems2(
  IMAGE_MODELS.filter((m) => m.tags?.includes(ModelTag.InstructiveEdit)),
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

export const IMAGE_EDITOR_PAGE_MODEL_LIST : ModelList = buildItems2(
  IMAGE_MODELS,
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

export const IMAGE_TO_VIDEO_PAGE_MODEL_LIST : ModelList = buildItems2(
  VIDEO_MODELS,
  <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
);

export const TEXT_TO_IMAGE_PAGE_MODEL_LIST : ModelList = buildItems2(
  IMAGE_MODELS,
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);
