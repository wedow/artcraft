import { ContextualLoadingBarProps } from "./type";

type uiAccessType = {
  loadingBar: ContextualLoadingBarProps;
};

export type { uiAccessType };

import { buttonRetry } from "./buttonRetry";
import { buttonTest } from "./buttonTest";
import { dialogChromakey } from "./dialogChromakey";
import { dialogError } from "./dialogError";
import { loadingBar } from "./loadingBar";
import { magicBox } from "./magicBox";
import { toolbarMain } from "./toolbarMain";
import { toolbarNode } from "./toolbarNode";
import { toolbarVideoExtraction } from "./toolbarVideoExtraction";

export const uiAccess = {
  buttonRetry,
  buttonTest,
  dialogChromakey,
  dialogError,
  loadingBar,
  magicBox,
  toolbarMain,
  toolbarNode,
  toolbarVideoExtraction,
};
