import { DialogTitle } from "@headlessui/react";
import { useSignalEffect } from "@preact/signals-react";
import { ModelCard } from "./ModelCard";
import { models } from "~/data/models";
import { selectedModel, dispatchers } from "~/signals/uiEvents/modelSelection";
import { useEffect } from "react";

interface ModelSelectionDialogProps {
  onClose: () => void;
}

export const ModelSelectionDialog = ({
  onClose,
}: ModelSelectionDialogProps) => {
  // This makes component re-render whenever signals change
  useSignalEffect(() => {
    selectedModel.value;
  });

  // Ensure a model is selected when the dialog opens
  useEffect(() => {
    if (selectedModel.value === null && models.length > 0) {
      dispatchers.setSelectedModel(models[0].id);
    }
  }, []);

  const handleSelectModel = (modelId: string) => {
    dispatchers.setSelectedModel(modelId);
    onClose(); // Close the dialog after selection
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <DialogTitle className="text-2xl font-bold">Select Model</DialogTitle>
        <p className="text-sm text-gray-400">Pick your base generation model</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            id={model.id}
            name={model.name}
            imageUrl={model.imageUrl}
            isDownloaded={model.isDownloaded}
            isSelected={selectedModel.value === model.id}
            isCompatible={true} // Base models are always compatible
            type="model"
            onSelect={handleSelectModel}
          />
        ))}
      </div>
    </div>
  );
};
