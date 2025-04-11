import {
  // useState,
  useRef,
} from "react";
import { twMerge } from "tailwind-merge";

import { DialogPanel, DialogTitle } from "@headlessui/react";

import { Button } from "~/components/ui";
import { ChromakeyProps, DialogChromakeyProps } from "./type";
import { dialogPanelStyles, paperWrapperStyles } from "~/components/styles";

export const DialogPanelChromakey = ({
  isChromakeyEnabled,
  chromakeyColor,
  onClose,
  onConfirm,
}: Omit<DialogChromakeyProps, "isShowing">) => {
  const prevState = useRef<ChromakeyProps>({
    isChromakeyEnabled,
    chromakeyColor,
  });

  // Needed later on when we need to facilitate changing colors
  // const [newState, setNewState] = useState<ChromakeyProps>({
  //   isChromakeyEnabled,
  //   color,
  // });

  const handleConfirm = () => {
    onConfirm({
      isChromakeyEnabled: !prevState.current.isChromakeyEnabled,
      chromakeyColor: prevState.current.chromakeyColor,
    });
    onClose();
  };

  return (
    <DialogPanel
      className={twMerge(paperWrapperStyles, dialogPanelStyles, "max-w-xl")}
    >
      <DialogTitle className="font-bold">Green Screen Removal</DialogTitle>
      <div>
        <p>
          If your video node has a green screen background, you can turn on
          chroma key to make the green area transparent.
        </p>
        <br />
        <p>
          The target green of this chroma key feature is:{" "}
          {`rgb(${chromakeyColor?.red},${chromakeyColor?.green},${chromakeyColor?.blue})`}
        </p>
      </div>
      <div className="flex justify-end gap-4">
        <Button onClick={onClose}>Close</Button>

        <Button onClick={handleConfirm}>
          {prevState.current.isChromakeyEnabled ? "Turn off" : "Turn On"}
        </Button>
      </div>
    </DialogPanel>
  );
};
