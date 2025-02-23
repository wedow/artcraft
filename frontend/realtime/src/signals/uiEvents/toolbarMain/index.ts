import { buttonDispatchers, buttonEventsHandlers } from "./toolbarMain";
import {
  loadingBarRetryDispatch,
  loadingBarRetryEventHandler,
} from "./loadingBar";
import { onPaintColorChanged, setPaintColor } from "./paintMode";
export const dispatchers = {
  ...buttonDispatchers,
  loadingBarRetry: loadingBarRetryDispatch,
  setPaintColor,
};
export const eventsHandlers = {
  ...buttonEventsHandlers,
  loadingBarRetry: loadingBarRetryEventHandler,
  onPaintColorChanged
};
