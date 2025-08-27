import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getCreatorIcon,
  Model,
  ModelConfig,
  TEXT_TO_IMAGE_PAGE_MODELS,
  CANVAS_2D_PAGE_MODELS,
  STAGE_3D_PAGE_MODELS,
  IMAGE_EDITOR_PAGE_MODELS,
  VIDEO_MODELS,
  IMAGE_MODELS,
} from "@storyteller/model-list";

export type ModelList = Omit<PopoverItem, "selected">[];

const withIcon = (creatorIcon: any, fallback: any) => creatorIcon || fallback;

const buildItems = (
  models: ModelConfig[],
  fallbackIcon: any
) =>
  models.map((m) => ({
    label: m.label,
    icon: withIcon(getCreatorIcon(m.info.creator), fallbackIcon),
    description: m.description,
    badges: m.badges?.map((b) => ({
      label: b.label,
      icon: <FontAwesomeIcon icon={faClock} />,
    })),
    modelConfig: m, // Access to full object.
    modelInfo: m.info,
  }));

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
    modelInfo: undefined, // NB: Dead.
    model: model,
  }));

/**
 * OLD MODEL LISTS
 */ 

export const CANVAS_2D_PAGE_MODEL_LIST : ModelList = buildItems(
  CANVAS_2D_PAGE_MODELS,
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

export const STAGE_3D_PAGE_MODEL_LIST : ModelList = buildItems(
  STAGE_3D_PAGE_MODELS,
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

export const IMAGE_EDITOR_PAGE_MODEL_LIST : ModelList = buildItems(
  IMAGE_EDITOR_PAGE_MODELS,
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

/**
 * IN-PROGRESS MIGRATION (messy for now)
 * We're gradually going to phase out ModelList, ModelConfig, etc.
 * We won't index by name, but rather id, or simply will always have full 
 * access to the object directly.
 */ 

export const IMAGE_TO_VIDEO_PAGE_MODEL_LIST : ModelList = buildItems2(
  VIDEO_MODELS,
  <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
);

export const TEXT_TO_IMAGE_PAGE_MODEL_LIST : ModelList = buildItems2(
  IMAGE_MODELS,
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);
