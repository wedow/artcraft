import { buttonDispatchers, buttonEventsHandlers } from "./toolbarMain";
import {
  loadingBarRetryDispatch,
  loadingBarRetryEventHandler,
} from "./loadingBar";
import { onEraseBrushSizeChanged, setEraseBrushSize } from "./eraseMode";
import { onPaintColorChanged, setPaintBrushSize, setPaintColor } from "./paintMode";
export const dispatchers = {
  ...buttonDispatchers,
  loadingBarRetry: loadingBarRetryDispatch,
  setPaintColor,
  setPaintBrushSize,
  setEraseBrushSize
};
export const eventsHandlers = {
  ...buttonEventsHandlers,
  loadingBarRetry: loadingBarRetryEventHandler,
  onPaintColorChanged,
  onEraseBrushSizeChanged
};
