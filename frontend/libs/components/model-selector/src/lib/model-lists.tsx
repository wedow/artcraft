import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IMAGE_MODELS } from "@storyteller/model-list";

export type ModelList = Omit<PopoverItem, "selected">[];

export const allModels = {
  video: [
    {
      label: "Kling 1.6 Pro",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Good quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Kling 2.1 Pro",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Kling 2.1 Master",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Master quality model ($$)",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Seedance 1.0 Lite",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Fast and high-quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Google Veo 2",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Fast and high-quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
  ],
  image: [
    {
      label: "Flux Pro 1.1 Ultra",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.flux_pro_1_1_ultra,
    },
    {
      label: "Flux Pro 1.1",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.flux_pro_1_1,
    },
    {
      label: "Flux 1 Dev",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.flux_1_dev,
    },
    {
      label: "Flux 1 Schnell",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
      modelInfo: IMAGE_MODELS.flux_1_schnell,
    },
    {
      label: "GPT Image 1 (GPT-4o)",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
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
};

export const videoGenerationModels: ModelList = allModels.video;
export const imageGenerationModels: ModelList = allModels.image;
