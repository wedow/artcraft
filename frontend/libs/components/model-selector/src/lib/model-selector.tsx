import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { useModelSelectorStore } from "./model-selector-store";
import { useMemo } from "react";
import { ModelPage } from "./model-pages";

interface ModelSelectorProps {
  items: Omit<PopoverItem, "selected">[];
  page: ModelPage;
  mode?: "hoverSelect" | "default" | "toggle" | "button";
  panelTitle?: string;
  buttonClassName?: string;
  panelClassName?: string;
  showIconsInList?: boolean;
  triggerLabel?: string;
}

export function ModelSelector({
  items,
  page,
  ...popoverProps
}: ModelSelectorProps) {
  const { selectedModels, setSelectedModel } = useModelSelectorStore();
  const selectedModel = selectedModels[page] || items[0]?.label;

  const handleModelSelect = (item: PopoverItem) => {
    setSelectedModel(page, item.label);
  };

  const modelList = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        selected: item.label === selectedModel,
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

export default ModelSelector;
