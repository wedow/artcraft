import { Dialog } from "@headlessui/react";

import { DialogPanelChromakey } from "./DialogPanelChromakey";
import { dialogBackgroundStyles } from "~/components/styles";
import { DialogChromakeyProps } from "./type";

export const DialogChromakey = ({
  isShowing,
  onClose,
  ...rest
}: DialogChromakeyProps) => {
  return (
    <Dialog
      open={isShowing}
      onClose={onClose}
      className="relative z-50"
      unmount={true}
    >
      <div className={dialogBackgroundStyles}>
        <DialogPanelChromakey {...rest} onClose={onClose} />
      </div>
    </Dialog>
  );
};
