import { faGear, faImages } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Activity } from "~/components/ui/Activity/Activity";
import { GalleryModal } from "@storyteller/ui-gallery-modal";
import { Button } from "@storyteller/ui-button";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { useState } from "react";

export const ToolbarTopRight = () => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [activeGalleryTab, setActiveGalleryTab] = useState("my-media");

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
        <Button
          icon={faImages}
          className="h-[42px] bg-[#5F5F68]/60 backdrop-blur-lg hover:bg-[#5F5F68]/90"
          onClick={() => setIsGalleryModalOpen(true)}
        >
          My Gallery
        </Button>
        <Activity />
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        mode="view"
        tabs={[
          { id: "my-media", label: "My generations" },
          { id: "uploads", label: "My uploads" },
        ]}
        activeTab={activeGalleryTab}
        onTabChange={setActiveGalleryTab}
      />
    </>
  );
};
