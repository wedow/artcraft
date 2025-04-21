import { faGear } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Activity } from "~/components/ui/Activity/Activity";
// import { paperWrapperStyles } from "~/components/styles";
// import { faPlus, faQuestion } from "@fortawesome/pro-solid-svg-icons";
// import { ToolbarButton } from "~/components/features/ToolbarButton";
import { Button } from "@storyteller/ui-button";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { useState } from "react";

export const ToolbarTopRight = () => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  return (
    <>
      <div
        className={twMerge("relative z-50 flex h-fit w-fit items-center gap-2")}
      >
        <Button
          icon={faGear}
          className="h-[42px] w-[42px] bg-[#5F5F68]/60 backdrop-blur-lg hover:bg-[#5F5F68]/90"
          onClick={() => setIsSettingsModalOpen(true)}
        />
        <Activity />
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};
