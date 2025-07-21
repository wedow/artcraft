import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  getCreatorIcon,
  ModelCreator,
} from "@storyteller/model-list";

export type ModelList = Omit<PopoverItem, "selected">[];

export const allModels = {
  video: [
    {
      label: "Kling 1.6 Pro",
      icon: getCreatorIcon(ModelCreator.Kling) || (
        <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
      ),
      description: "Good quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: VIDEO_MODELS.kling_1_6_pro,
    },
    {
      label: "Kling 2.1 Pro",
      icon: getCreatorIcon(ModelCreator.Kling) || (
        <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
      ),
      description: "High quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: VIDEO_MODELS.kling_2_1_pro,
    },
    {
      label: "Kling 2.1 Master",
      icon: getCreatorIcon(ModelCreator.Kling) || (
        <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
      ),
      description: "Master quality model ($$)",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: VIDEO_MODELS.kling_2_1_master,
    },
    {
      label: "Seedance 1.0 Lite",
      icon: getCreatorIcon(ModelCreator.Bytedance) || (
        <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
      ),
      description: "Fast and high-quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: VIDEO_MODELS.seedance_1_0_lite,
    },
    {
      label: "Google Veo 2",
      icon: getCreatorIcon(ModelCreator.Google) || (
        <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
      ),
      description: "Fast and high-quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: VIDEO_MODELS.veo_2,
    },
  ],
  image: [
    {
      label: "Flux Pro 1.1 Ultra",
      icon: getCreatorIcon(ModelCreator.BlackForestLabs) || (
        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
      ),
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.flux_pro_1_1_ultra,
    },
    {
      label: "Flux Pro 1.1",
      icon: getCreatorIcon(ModelCreator.BlackForestLabs) || (
        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
      ),
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.flux_pro_1_1,
    },
    {
      label: "Flux 1 Dev",
      icon: getCreatorIcon(ModelCreator.BlackForestLabs) || (
        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
      ),
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.flux_1_dev,
    },
    {
      label: "Flux 1 Schnell",
      icon: getCreatorIcon(ModelCreator.BlackForestLabs) || (
        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
      ),
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.flux_1_schnell,
    },
    {
      label: "GPT Image 1 (GPT-4o)",
      icon: getCreatorIcon(ModelCreator.OpenAi) || (
        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
      ),
      description: "Slow, ultra instructive model",
      badges: [{ label: "45 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.gpt_image_1,
    },
    //{
    //  id: "todo",
    //  label: "Recraft 3",
    //  icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
    //  description: "Fast and high-quality model",
    //  badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    //},
    //{
    //  id: "todo",
    //  label: "Flux.1 Kontext",
    //  icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
    //  description: "New model with advanced context",
    //  badges: [{ label: "25 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    //},
  ],
  // These models are used for 2D and 3D editing and scene building.
  instructiveImageEdits: [
    {
      label: "GPT-4o",
      icon: getCreatorIcon(ModelCreator.OpenAi) || (
        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
      ),
      description: "High quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.gpt_image_1,
    },
    {
      label: "FLUX.1 Kontext",
      icon: getCreatorIcon(ModelCreator.BlackForestLabs) || (
        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
      ),
      description: "Fast and high-quality model",
      badges: [{ label: "20 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.gpt_image_1, // TODO: Wrong metadata!
    },
  ],
};

export const videoGenerationModels: ModelList = allModels.video;
export const imageGenerationModels: ModelList = allModels.image;
export const instructiveImageEditModels: ModelList =
  allModels.instructiveImageEdits;
