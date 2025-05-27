import {
  faArrowsRotate,
  faArrowsUpDownLeftRight,
  faMagicWandSparkles,
  faPlus,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/pro-solid-svg-icons";
import { ButtonIconSelect } from "@storyteller/ui-button-icon-select";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { EngineContext } from "../../contexts/EngineContext";
import { useContext, useEffect, useState } from "react";
import { assetModalVisibleDuringDrag, assetModalVisible } from "../../signals";
import { AssetModal } from "../AssetMenu/AssetModal";
import { selectedMode } from "../../signals/selectedMode";
import { useSignals } from "@preact/signals-react/runtime";
import { outlinerState } from "../../signals/outliner/outliner";
import { twMerge } from "tailwind-merge";

export const Controls3D = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);
  const [showEmptySceneTooltip, setShowEmptySceneTooltip] = useState(false);

  useEffect(() => {
    // Check if scene is empty and onboarding helper is not visible
    const checkSceneEmpty = () => {
      const isSceneEmpty =
        outlinerState.items.value.length === 0 && !assetModalVisible.value;

      setShowEmptySceneTooltip(isSceneEmpty);
    };

    // Initial check
    checkSceneEmpty();

    // Subscribe to outliner state changes
    const unsubscribe = outlinerState.items.subscribe(checkSceneEmpty);

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetModalVisible.value]);

  const handleModeChange = (value: string) => {
    selectedMode.value = value;
    switch (value) {
      case "move":
        handleMoveArrows();
        break;
      case "rotate":
        handleRotateArrows();
        break;
      case "scale":
        handleZoomArrows();
        break;
      default:
        console.log("Unknown option");
    }
  };

  const handleMoveArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("translate");
  };
  const handleRotateArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("rotate");
  };
  const handleZoomArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("scale");
  };

  const modes = [
    {
      value: "move",
      icon: faArrowsUpDownLeftRight,
      text: "Move",
      tooltip: "Move (T)",
    },
    {
      value: "rotate",
      icon: faArrowsRotate,
      text: "Rotate",
      tooltip: "Rotate (R)",
    },
    {
      value: "scale",
      icon: faUpRightAndDownLeftFromCenter,
      text: "Scale",
      tooltip: "Scale (G)",
    },
  ];

  const handleOpenModal = () => {
    assetModalVisibleDuringDrag.value = true;
    assetModalVisible.value = true;
  };

  return (
    <>
      <div className="flex justify-center">
        <div className="glass rounded-b-xl p-1.5 pr-2 text-white shadow-md">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex items-center gap-1">
              <div className="relative">
                {showEmptySceneTooltip && (
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 transform whitespace-nowrap">
                    <div className="animate-bounce rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-lg">
                      Click + to add your first 3D asset!
                      <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 transform bg-brand-primary" />
                    </div>
                  </div>
                )}
                <Tooltip
                  content="Add 3D asset to scene (B)"
                  position="bottom"
                  delay={300}
                  closeOnClick
                  className={twMerge(
                    showEmptySceneTooltip ? "hidden" : "block",
                  )}
                >
                  <Button
                    icon={faPlus}
                    className={`h-9 w-9 rounded-[10px] text-lg ${
                      showEmptySceneTooltip
                        ? "border-white/80 bg-brand-primary/90"
                        : ""
                    }`}
                    onClick={handleOpenModal}
                  />
                </Tooltip>
              </div>
              <Tooltip
                content="Create 3D model from image"
                position="bottom"
                delay={300}
                closeOnClick
              >
                <Button
                  icon={faMagicWandSparkles}
                  className="text-md h-9 w-9 rounded-[10px] bg-white/10"
                  variant="secondary"
                  disabled={true}
                  onClick={handleOpenModal}
                />
              </Tooltip>
            </div>

            <span className="opacity-20">|</span>
            <ButtonIconSelect
              options={modes}
              onOptionChange={handleModeChange}
              selectedOption={selectedMode.value}
            />
          </div>
        </div>
      </div>

      <AssetModal />
    </>
  );
};
