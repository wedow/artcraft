import { Dialog } from "@headlessui/react";

import { DialogPanelChromakey } from "./DialogPanelChromakey";
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
      <div>
        <DialogPanelChromakey {...rest} onClose={onClose} />
      </div>
    </Dialog>
  );
};
