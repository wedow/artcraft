import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { BaseDialog } from "~/components/ui/BaseDialog";
import { useSignalEffect } from "@preact/signals-react";
import { selectedModel, selectedLora } from "~/signals/uiEvents/modelSelection";
import { getModelById, getLoraById } from "~/data/models";
import { ModelSelectionDialog } from "./ModelSelectionDialog";
import { LoraSelectionDialog } from "./LoraSelectionDialog";

interface ModelButtonProps {
  iconSrc: string;
  iconAlt: string;
  label?: string;
  subtitle?: string;
  type: "model" | "lora";
}

export const ModelButton = ({
  iconSrc,
  iconAlt,
  label,
  subtitle,
  type,
}: ModelButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Update button label based on selection
  useSignalEffect(() => {
    // This will re-render component when these signals change
    selectedModel.value;
    selectedLora.value;
  });

  // Set button text based on current selection
  let buttonLabel = label;
  let buttonSubtitle = subtitle;

  if (type === "model" && selectedModel.value) {
    const model = getModelById(selectedModel.value);
    if (model) {
      buttonLabel = model.name;
      buttonSubtitle = "Model";
    }
  }

  if (type === "lora" && selectedLora.value) {
    const lora = getLoraById(selectedLora.value);
    if (lora) {
      buttonLabel = lora.name;
      buttonSubtitle = "LoRA";
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        className="glass flex w-40 items-center justify-start gap-2 bg-ui-controls/70 p-1"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={iconSrc}
          alt={iconAlt}
          className="h-8 w-8 rounded-md bg-white/10"
        />
        {buttonSubtitle ? (
          <div className="flex flex-col gap-0 truncate text-start">
            <span className="truncate text-[11px] opacity-60">
              {buttonSubtitle}
            </span>
            <span className="truncate text-[13px] opacity-80">
              {buttonLabel}
            </span>
          </div>
        ) : (
          <span className="truncate">{buttonLabel}</span>
        )}
      </Button>

      <BaseDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="max-w-3xl"
      >
        {type === "model" ? (
          <ModelSelectionDialog onClose={() => setIsOpen(false)} />
        ) : (
          <LoraSelectionDialog onClose={() => setIsOpen(false)} />
        )}
      </BaseDialog>
    </>
  );
};
