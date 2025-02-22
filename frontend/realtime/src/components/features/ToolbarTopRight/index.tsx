import { faSave } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Button } from "~/components/ui/Button";
import { toolbarMain } from "~/signals/uiAccess/toolbarMain";
import { dispatchers } from "~/signals/uiEvents/toolbarMain";
import { ToolbarMainButtonNames } from "../ToolbarMain/enum";

// import { paperWrapperStyles } from "~/components/styles";
// import { faPlus, faQuestion } from "@fortawesome/pro-solid-svg-icons";
// import { ToolbarButton } from "~/components/features/ToolbarButton";

export const ToolbarTopRight = () => {
  const saveButtonState =
    toolbarMain.signal.value.buttonStates[ToolbarMainButtonNames.SAVE];

  return (
    <div
      className={twMerge(
        "z-20 mt-2 flex h-fit w-fit items-center gap-1 p-4 py-2.5",
      )}
    >
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
