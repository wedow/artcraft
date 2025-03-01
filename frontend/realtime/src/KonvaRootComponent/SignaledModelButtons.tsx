import { twMerge } from "tailwind-merge";
import { ModelButton } from "~/components/features/ModelSelection/ModelButton";
import { useSignalEffect } from "@preact/signals-react";
import { selectedModel, selectedLora } from "~/signals/uiEvents/modelSelection";
import { getModelById, getLoraById } from "~/data/models";

export const SignaledModelButtons = () => {
  // This makes the component re-render when the selected model or lora changes
  useSignalEffect(() => {
    selectedModel.value;
    selectedLora.value;
  });

  // Get the selected model's image or use default
  const selectedModelData = selectedModel.value
    ? getModelById(selectedModel.value)
    : null;
  const modelIconSrc = selectedModelData?.imageUrl || "";

  // Get the selected LoRA's image or use default
  const selectedLoraData = selectedLora.value
    ? getLoraById(selectedLora.value)
    : null;
  const loraIconSrc = selectedLoraData?.imageUrl || "";

  return (
    <div className={twMerge("z-20 flex h-fit w-fit items-center gap-2")}>
      <ModelButton
        iconSrc={modelIconSrc}
        iconAlt={selectedModelData?.name || "Model"}
        label={selectedModelData?.name || "Realistic"}
        subtitle="Model"
        type="model"
      />

      <ModelButton
        iconSrc={loraIconSrc}
        iconAlt={selectedLoraData?.name || "LoRA"}
        label={selectedLoraData?.name || "Detailed Tweaker"}
        subtitle="LoRA"
        type="lora"
      />
    </div>
  );
};
