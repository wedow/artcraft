import { createContext } from "react";
import { MediaItem } from "~/pages/PageEnigma/models";

export const TrackContext = createContext<{
  // drag and drop
  startDrag: (item: MediaItem) => void;
  endDrag: () => void;
}>({
  startDrag: () => {},
  endDrag: () => {},
});
