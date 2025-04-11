import {
  faArrowsRotate,
  faArrowsUpDownLeftRight,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/pro-solid-svg-icons";
import { ButtonIconSelect } from "~/components";
import { EngineContext } from "../../contexts/EngineContext";
import { useContext } from "react";

export const Controls3D = () => {
  const editorEngine = useContext(EngineContext);

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

  const handleModeChange = (value: string) => {
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

  const modes = [
    { value: "move", icon: faArrowsUpDownLeftRight, text: "Move (T)" },
    { value: "rotate", icon: faArrowsRotate, text: "Rotate (R)" },
    { value: "scale", icon: faUpRightAndDownLeftFromCenter, text: "Scale (G)" },
  ];

  return (
    <div>
      <div className="flex justify-center">
        <div className="rounded-b-lg border border-[#3F3F3F] bg-ui-controls p-1.5 text-white shadow-md">
          <div className="flex items-center justify-center gap-3">
            <ButtonIconSelect
              options={modes}
              onOptionChange={handleModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
