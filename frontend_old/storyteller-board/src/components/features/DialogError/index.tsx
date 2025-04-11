import { twMerge } from "tailwind-merge";

import {
  dialogBackgroundStyles,
  dialogPanelStyles,
  paperWrapperStyles,
} from "~/components/styles";
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Button } from "~/components/ui";

export const DialogError = ({
  isShowing,
  title,
  message,
  onClose,
}: {
  isShowing: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) => {
  return (
    <Dialog open={isShowing} onClose={onClose} className="relative z-50">
      <div className={dialogBackgroundStyles}>
        <DialogPanel className={twMerge(paperWrapperStyles, dialogPanelStyles)}>
          <DialogTitle className="font-bold">{title}</DialogTitle>
          <Description>{message}</Description>
          <div className="flex justify-end gap-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
