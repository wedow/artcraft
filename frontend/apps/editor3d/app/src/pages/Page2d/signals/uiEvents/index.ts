import {
  dispatchers as addMediaDispatchers,
  events as addMediaEvents,
} from "./addMedia";

import {
  dispatcher as buttonTestDispatcher,
  eventsHandler as buttonTestEvent,
} from "./buttonTest";
import {
  dispatcher as buttonRetryDispatcher,
  eventsHandler as buttonRetryEvent,
} from "./buttonRetry";

import {
  dispatchers as toolbarMainDispatchers,
  eventsHandlers as toolbarMainEvents,
} from "./toolbarMain";
import {
  dispatchers as toolbarNodeDispatchers,
  eventsHandlers as toolbarNodeEvents,
} from "./toolbarNode";

import {
  dispatchers as promptDispatchers,
  events as promptEvents,
} from "./promptSettings";
import {
  dispatchers as loadingIndicatorDispatchers,
  events as loadingIndicatorEvents,
} from "./loadingIndicator";
import {
  dispatchers as modelSelectionDispatchers,
  events as modelSelectionEvents,
} from "./modelSelection";
import { appMode, changeAppMode, appModeEvents } from "./appMode";

export const uiEvents = {
  ...addMediaEvents,
  buttonRetry: buttonRetryEvent,
  buttonTest: buttonTestEvent,
  toolbarMain: toolbarMainEvents,
  toolbarNode: toolbarNodeEvents,
  promptEvents: promptEvents,
  loadingIndicator: loadingIndicatorEvents,
  modelSelection: modelSelectionEvents,
  appMode: appModeEvents,
};
export const dispatchUiEvents = {
  ...addMediaDispatchers,
  buttonRetry: buttonRetryDispatcher,
  buttonTest: buttonTestDispatcher,
  toolbarMain: toolbarMainDispatchers,
  toolbarNode: toolbarNodeDispatchers,
  promptSettings: promptDispatchers,
  loadingIndicator: loadingIndicatorDispatchers,
  modelSelection: modelSelectionDispatchers,
  changeAppMode,
};

export { appMode };
