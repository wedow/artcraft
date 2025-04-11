import {
  dispatchers as addMediaDispatchers,
  events as addMediaEvents,
} from "./addMedia";
import { aiStylizeDispatchers, aiStylizeEvents } from "./aiStylize";
import {
  dispatcher as buttonTestDispatcher,
  eventsHandler as buttonTestEvent,
} from "./buttonTest";
import {
  dispatcher as buttonRetryDispatcher,
  eventsHandler as buttonRetryEvent,
} from "./buttonRetry";
import { dispatchChromakeyRequest, onChromakeyRequest } from "./chromakey";
import {
  dispatchers as toolbarMainDispatchers,
  eventsHandlers as toolbarMainEvents,
} from "./toolbarMain";
import {
  dispatchers as toolbarNodeDispatchers,
  eventsHandlers as toolbarNodeEvents,
} from "./toolbarNode";
import {
  dispatchers as toolbarVideoExtractionDispatchers,
  eventsHandlers as toolbarVideoExtractionEvents,
} from "./toolbarVideoExtraction";

export const uiEvents = {
  ...addMediaEvents,
  onChromakeyRequest,
  aiStylize: aiStylizeEvents,
  buttonRetry: buttonRetryEvent,
  buttonTest: buttonTestEvent,
  toolbarMain: toolbarMainEvents,
  toolbarNode: toolbarNodeEvents,
  toolbarVideoExtraction: toolbarVideoExtractionEvents,
};
export const dispatchUiEvents = {
  ...addMediaDispatchers,
  dispatchChromakeyRequest,
  aiStylize: aiStylizeDispatchers,
  buttonRetry: buttonRetryDispatcher,
  buttonTest: buttonTestDispatcher,
  toolbarMain: toolbarMainDispatchers,
  toolbarNode: toolbarNodeDispatchers,
  toolbarVideoExtraction: toolbarVideoExtractionDispatchers,
};
