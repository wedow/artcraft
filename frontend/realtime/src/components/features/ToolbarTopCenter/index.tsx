import { twMerge } from "tailwind-merge";
import { Button } from "~/components/ui/Button";
import { useState } from "react";
import { BaseDialog } from "~/components/ui/BaseDialog";
import { DialogTitle } from "@headlessui/react";
import { SignaledLoadingIndicator } from "~/KonvaRootComponent/SignaledLoadingIndicator";

interface ModelButtonProps {
  iconSrc: string;
  iconAlt: string;
  label?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const ModelButton = ({
  iconSrc,
  iconAlt,
  label,
  subtitle,
  children,
}: ModelButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
        {subtitle ? (
          <div className="flex flex-col gap-0 truncate text-start">
            <span className="truncate text-[11px] opacity-60">{subtitle}</span>
            <span className="truncate text-[13px] opacity-80">{label}</span>
          </div>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </Button>

      <BaseDialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </BaseDialog>
    </>
  );
};

export const ToolbarTopCenter = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Model selection buttons (only shown in dev mode for now) */}
      {import.meta.env.DEV && (
        <div className={twMerge("z-20 flex h-fit w-fit items-center gap-2")}>
          <ModelButton
            iconSrc="/resources/icons/model.png"
            iconAlt="Model"
            label="Realistic"
            subtitle="Model"
          >
            <div className="flex flex-col gap-2 text-sm">
              <DialogTitle className="text-2xl font-bold">
                Select Model
              </DialogTitle>
              <p>Model configuration options will go here</p>
            </div>
          </ModelButton>

          <ModelButton
            iconSrc="/resources/icons/lora.png"
            iconAlt="LoRA"
            label="Detailed Tweaker"
            subtitle="LoRA"
          >
            <div className="flex flex-col gap-2 text-sm">
              <DialogTitle className="text-2xl font-bold">
                Select LoRA
              </DialogTitle>
              <p>LoRA configuration options will go here</p>
            </div>
          </ModelButton>
        </div>
      )}

      {/* Loading models indicator (only shown in dev mode for now) */}
      {import.meta.env.DEV && <SignaledLoadingIndicator />}
    </div>
  );
};
