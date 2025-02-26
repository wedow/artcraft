import {
  faRectangle,
  faRectanglePortrait,
  faSave,
  faSquare,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Button } from "~/components/ui/Button";
import { toolbarMain } from "~/signals/uiAccess/toolbarMain";
import { dispatchers } from "~/signals/uiEvents/toolbarMain";
import { ToolbarMainButtonNames } from "../ToolbarMain/enum";
import { ToggleButton } from "~/components/ui/ToggleButton";
import { useState } from "react";

// import { paperWrapperStyles } from "~/components/styles";
// import { faPlus, faQuestion } from "@fortawesome/pro-solid-svg-icons";
// import { ToolbarButton } from "~/components/features/ToolbarButton";

export const ToolbarTopRight = () => {
  const saveButtonState =
    toolbarMain.signal.value.buttonStates[ToolbarMainButtonNames.SAVE];
  const [aspectRatio, setAspectRatio] = useState("1:1");

  return (
    <div className={twMerge("z-20 flex h-fit w-fit items-center gap-2")}>
      {import.meta.env.DEV && ( // only show in dev mode for now
        <ToggleButton
          label="Ratio"
          value={aspectRatio}
          onChange={setAspectRatio}
          options={["1:1", "3:2", "2:3"]}
          icons={{
            "1:1": faSquare,
            "3:2": faRectangle,
            "2:3": faRectanglePortrait,
          }}
        />
      )}
      <Button
        icon={faSave}
        onClick={dispatchers[ToolbarMainButtonNames.SAVE]}
        disabled={saveButtonState?.disabled}
      >
        Save Image
      </Button>
    </div>
  );
};
