import { buttonDispatchers, buttonEventsHandlers } from "./toolbarMain";
import {
  loadingBarRetryDispatch,
  loadingBarRetryEventHandler,
} from "./loadingBar";
export const dispatchers = {
  ...buttonDispatchers,
  loadingBarRetry: loadingBarRetryDispatch,
};
export const eventsHandlers = {
  ...buttonEventsHandlers,
  loadingBarRetry: loadingBarRetryEventHandler,
};
