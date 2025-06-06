import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { useModelSelectorStore } from "./model-selector-store";
import { useMemo } from "react";
import { ModelCategory } from "./model-categories";

interface ModelSelectorProps {
  items: Omit<PopoverItem, "selected">[];
  category: ModelCategory;
  mode?: "hoverSelect" | "default" | "toggle" | "button";
  panelTitle?: string;
  buttonClassName?: string;
  panelClassName?: string;
  showIconsInList?: boolean;
  triggerLabel?: string;
}

export function ModelSelector({
  items,
  category,
  ...popoverProps
}: ModelSelectorProps) {
  const { selectedModels, setSelectedModel } = useModelSelectorStore();
  const selectedModel = selectedModels[category] || items[0]?.label;

  const handleModelSelect = (item: PopoverItem) => {
    setSelectedModel(category, item.label);
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
