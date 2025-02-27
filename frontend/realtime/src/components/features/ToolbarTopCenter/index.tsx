import { twMerge } from "tailwind-merge";
import { Button } from "~/components/ui/Button";
import { useState } from "react";
import { BaseDialog } from "~/components/ui/BaseDialog";
import { DialogTitle } from "@headlessui/react";
import { LoadingBar, LoadingBarStatus } from "~/components/ui";

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
      {import.meta.env.DEV && (
        <div className="flex min-w-[328px] flex-col items-center">
          <LoadingBar progress={70} status={LoadingBarStatus.LOADING} />
          <div className="glass flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium opacity-60">
            <svg
              className="h-3 w-3 animate-spin text-white/40"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
            >
              <path
                d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                stroke="currentColor"
                stroke-width="5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                stroke="currentColor"
                stroke-width="5"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="text-white/90"
              ></path>
            </svg>
            Downloading models - 70%
          </div>
        </div>
      )}
    </div>
  );
};
