import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getCreatorIcon,
  getModelsByCategory,
  getInstructiveImageEditModels,
  getEditorModels,
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

const imageModels = getModelsByCategory("image");
const videoModels = getModelsByCategory("video");
const instructiveModels = getInstructiveImageEditModels();

// Models for the editor page (not 2d canvas, the inpaint/outpaint editor)
const imageEditModels = getEditorModels();

export const allModels = {
  video: buildItems(
    videoModels as any,
    <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
  ),
  image: buildItems(
    imageModels as any,
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  ),
  instructiveImageEdits: buildItems(
    instructiveModels as any,
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  ),
  imageEditorModels: buildItems(
    imageEditModels as any,
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  ),
};

export const videoGenerationModels: ModelList = allModels.video;
export const imageGenerationModels: ModelList = allModels.image;
export const instructiveImageEditModels: ModelList =
  allModels.instructiveImageEdits;

export const imageEditorModels: ModelList = allModels.imageEditorModels;
