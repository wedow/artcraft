import {
  faArrowsRotate,
  faArrowsUpDownLeftRight,
  faMagicWandSparkles,
  faPlus,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/pro-solid-svg-icons";
import { Button, ButtonIconSelect, Tooltip } from "~/components";
import { EngineContext } from "../../contexts/EngineContext";
import { useContext } from "react";
import { assetModalVisibleDuringDrag, assetModalVisible } from "../../signals";
import { AssetModal } from "../AssetMenu/AssetModal";
import { selectedMode } from "../../signals/selectedMode";
import { useSignals } from "@preact/signals-react/runtime";

export const Controls3D = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);

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
    <div>
      <div className="flex justify-center">
        <div className="glass rounded-b-xl p-1.5 pr-2 text-white shadow-md">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex items-center gap-1">
              <Tooltip
                content="Add 3D asset to scene (B)"
                position="bottom"
                delay={100}
                closeOnClick
              >
                <Button
                  icon={faPlus}
                  className="h-9 w-9 rounded-[10px] text-lg"
                  onClick={handleOpenModal}
                />
              </Tooltip>
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
    </div>
  );
};
