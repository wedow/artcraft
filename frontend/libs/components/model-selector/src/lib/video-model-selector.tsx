import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { useEffect, useMemo } from "react";
import { ModelPage } from "./model-pages";
import { useVideoModelSelectorStore } from "./video-model-selector-store";
import { VideoModel } from "@storyteller/model-list";

/**
 * TODO: This is temporary. We'll create a new "ModelSelectorState" that is typesafe and isn't just scoped to videos.
 */
interface VideoModelSelectorProps {
  items: Omit<PopoverItem, "selected">[];
  page: ModelPage;
  mode?: "hoverSelect" | "default" | "toggle" | "button";
  panelTitle?: string;
  buttonClassName?: string;
  panelClassName?: string;
  showIconsInList?: boolean;
  triggerLabel?: string;
}

export function VideoModelSelector({
  items,
  page,
  ...popoverProps
}: VideoModelSelectorProps) {
  const { selectedModel, setSelectedModel } = useVideoModelSelectorStore();

  //// For the first mount, make sure the selected model is set for other components to listen
  //useEffect(() => {
  //  // Initialize selected model if not set
  //  if (!selectedModels[page] && items[0]) {
  //    setSelectedModel(page, items[0].label);
  //  }
  //}, []);

  const handleModelSelect = (item: PopoverItem) => {
    if (!item.model) return;
    if (!(item.model instanceof VideoModel)) return;
    setSelectedModel(item.model);
  };

  const modelList = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        selected: item.model === selectedModel,
      })),
    [items, selectedModel]
  );

  return (
    <PopoverMenu
      items={modelList}
      onSelect={handleModelSelect}
      mode="hoverSelect"
      {...popoverProps}
    />
  );
}

export default VideoModelSelector;
