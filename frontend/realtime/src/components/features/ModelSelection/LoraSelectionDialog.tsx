import { DialogTitle } from "@headlessui/react";
import { useSignalEffect } from "@preact/signals-react";
import { ModelCard } from "./ModelCard";
import { loras, isLoraCompatibleWithModel } from "~/data/models";
import {
  selectedModel,
  selectedLora,
  dispatchers,
} from "~/signals/uiEvents/modelSelection";

interface LoraSelectionDialogProps {
  onClose: () => void;
}

export const LoraSelectionDialog = ({ onClose }: LoraSelectionDialogProps) => {
  // This makes component re-render whenever signals change
  useSignalEffect(() => {
    selectedModel.value;
    selectedLora.value;
  });

  const handleSelectLora = (loraId: string) => {
    dispatchers.setSelectedLora(loraId);
    onClose(); // Close the dialog after selection
  };

  const currentModelId = selectedModel.value;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <DialogTitle className="text-2xl font-bold">Select LoRA</DialogTitle>
        <p className="text-sm text-gray-400">
          Pick a LoRA to enhance your selected model
          {!currentModelId && (
            <span className="ml-1 text-yellow-500">
              (Select a base model first)
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {loras.map((lora) => (
          <ModelCard
            key={lora.id}
            id={lora.id}
            name={lora.name}
            imageUrl={lora.imageUrl}
            isDownloaded={lora.isDownloaded}
            isSelected={selectedLora.value === lora.id}
            isCompatible={
              currentModelId
                ? isLoraCompatibleWithModel(lora.id, currentModelId)
                : false
            }
            type="lora"
            onSelect={handleSelectLora}
          />
        ))}
      </div>
    </div>
  );
};
