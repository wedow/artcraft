import { faCube, faMagicWandSparkles } from "@fortawesome/pro-solid-svg-icons";
import { Button, Tooltip } from "~/components";
import { useState } from "react";
import { AssetModal } from "./AssetModal";

export const AssetMenu = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddAsset = () => {
    // TODO: Implement asset addition logic
    console.log("Adding asset...");
  };

  return (
    <>
      <div className="glass absolute left-2 top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-lg p-1">
        <Tooltip content="Add 3D object to scene" position="right" delay={100}>
          <Button
            icon={faCube}
            className="h-12 w-12 text-lg"
            onClick={() => setIsModalOpen(true)}
          />
        </Tooltip>
        <Tooltip
          content="Create 3D model from image"
          position="right"
          delay={100}
        >
          <Button
            icon={faMagicWandSparkles}
            className="h-12 w-12 text-lg"
            variant="secondary"
            disabled={true}
            onClick={() => setIsModalOpen(true)}
          />
        </Tooltip>
      </div>

      <AssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddAsset={handleAddAsset}
      />
    </>
  );
};
