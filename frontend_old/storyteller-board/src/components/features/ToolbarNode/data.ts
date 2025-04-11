import { ToolbarNodeButtonNames as ButtonNames } from "./enums";
import {
  faArrowUpFromLine,
  faArrowDownFromLine,
  faHatWitch,
  faScalpelLineDashed,
  faTransporter,
  faTrashCan,
  faVectorSquare,
  faDownload,
} from "@fortawesome/pro-solid-svg-icons";

export const ToolbarNodeButtonData = [
  {
    name: ButtonNames.TRANSFORM,
    icon: faVectorSquare,
    tooltip: "Move",
  },
  {
    name: ButtonNames.CHROMA,
    icon: faTransporter,
    tooltip: "Green Screen Removal",
  },
  {
    name: ButtonNames.AI_STYLIZE,
    icon: faHatWitch,
    tooltip: "AI Stylize",
  },
  {
    name: ButtonNames.SEGMENTATION,
    icon: faScalpelLineDashed,
    tooltip: "Select an Extraction",
  },
  {
    name: ButtonNames.MOVE_LAYER_UP,
    icon: faArrowUpFromLine,
    tooltip: "Move Layer Up",
  },
  {
    name: ButtonNames.MOVE_LAYER_DOWN,
    icon: faArrowDownFromLine,
    tooltip: "Move Layer Down",
  },
  {
    name: ButtonNames.DELETE,
    icon: faTrashCan,
    tooltip: "Delete",
  },
  {
    name: ButtonNames.DOWNLOAD,
    icon: faDownload,
    tooltip: "Download",
  },
];
