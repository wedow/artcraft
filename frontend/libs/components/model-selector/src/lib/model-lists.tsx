import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type ModelList = Omit<PopoverItem, "selected">[];

export const allModels = {
  video: [
    {
      id: "kling_1.6_pro",
      label: "Kling 1.6 Pro",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Good quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      id: "kling_2.1_pro",
      label: "Kling 2.1 Pro",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      id: "kling_2.1_master",
      label: "Kling 2.1 Master",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Master quality model ($$)",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      id: "seedance_1.0_lite",
      label: "Seedance 1.0 Lite",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Fast and high-quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      id: "veo_2",
      label: "Google Veo 2",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      description: "Fast and high-quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
  ],
  image: [
    {
      id: "todo",
      label: "GPT Image 1 (GPT-4o)",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "Slow, ultra instructive model",
      badges: [{ label: "45 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      id: "todo",
      label: "Flux Pro Ultra",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "High quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      id: "todo",
      label: "Recraft 3",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "Fast and high-quality model",
      badges: [{ label: "15 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      id: "todo",
      label: "Flux.1 Kontext",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      description: "New model with advanced context",
      badges: [{ label: "25 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
  ],
};

export const videoGenerationModels: ModelList = allModels.video;
export const imageGenerationModels: ModelList = allModels.image;
