import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type ModelList = Omit<PopoverItem, "selected">[];

export const allModels = {
  video: [
    {
      label: "Kling 2.0",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Runway",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Fast and high-quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
  ],
  image: [
    {
      label: "GPT Image 1 (GPT-4o)",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "Slow, ultra instructive model",
      badges: [{ label: "45 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Flux Pro Ultra",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Recraft 3",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "Fast and high-quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Flux.1 Kontext",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "New model with advanced context",
      badges: [{ label: "25 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
  ],
};

export const videoGenerationModels: ModelList = allModels.video;
export const imageGenerationModels: ModelList = allModels.image;
