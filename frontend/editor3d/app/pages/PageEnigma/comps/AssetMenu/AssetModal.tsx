import { TransitionDialogue } from "~/components/reusable/TransitionDialogue";
import { faPlus, faSearch, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, CloseButton, Input, Tooltip } from "~/components";
import { TabSelector } from "~/components/reusable/TabSelector";
import { useState } from "react";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: () => void;
}

export const AssetModal = ({
  isOpen,
  onClose,
  onAddAsset,
}: AssetModalProps) => {
  const [activeTab, setActiveTab] = useState("details");

  const tabs = [
    { id: "library", label: "Library" },
    { id: "mine", label: "Mine" },
  ];

  return (
    <TransitionDialogue
      isOpen={isOpen}
      onClose={onClose}
      className="h-[500px] max-w-3xl"
      childPadding={false}
    >
      <div className="grid h-full grid-cols-12 gap-3">
        <div className="relative col-span-3 p-3 pt-2 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 after:dark:bg-white/10">
          <div className="flex items-center justify-between gap-2.5 py-0.5">
            <h2 className="text-[18px] font-semibold opacity-80">3D Assets</h2>
            <Tooltip content="Upload model" position="top" delay={200}>
              <Button
                className="h-6 w-6 rounded-full border-none bg-transparent text-white/70 transition-colors hover:bg-transparent hover:text-white/100"
                onClick={onAddAsset}
              >
                <FontAwesomeIcon icon={faPlus} className="text-xl" />
              </Button>
            </Tooltip>
          </div>
          <hr className="my-2 w-full border-white/10" />
          <div className="space-y-1">{/* Asset list will go here */}</div>
        </div>
        <div className="col-span-9 p-3 ps-0 pt-2">
          <div className="flex h-full flex-col">
            <div>
              <div className="flex items-center gap-4">
                <TabSelector
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  className="w-auto"
                />
                <Input placeholder="Search" className="grow" icon={faSearch} />
                <CloseButton onClick={onClose} />
              </div>
              <div className="space-y-4">
                {/* Asset details will go here */}
              </div>
            </div>
            <div className="mt-auto flex justify-end pt-4">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        </div>
      </div>
    </TransitionDialogue>
  );
};
