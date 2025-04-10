import { useEffect, Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import {
  disableHotkeyInput,
  enableHotkeyInput,
  DomLevels,
} from "~/pages/PageEnigma/signals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconDefinition,
  faDownLeftAndUpRightToCenter,
} from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "~/components";

const DialogBackdrop = ({ className }: { className?: string }) => {
  useEffect(() => {
    disableHotkeyInput(DomLevels.DIALOGUE);
    return () => {
      enableHotkeyInput(DomLevels.DIALOGUE);
    };
  }, []);

  return (
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={twMerge("fixed inset-0 bg-black/60", className)} />
    </Transition.Child>
  );
};

export const TransitionDialogue = ({
  isOpen,
  title,
  titleIcon,
  onTitleIconClick,
  onClose,
  className,
  backdropClassName,
  width,
  children,
  childPadding = true,
  titleIconClassName,
  showClose = true,
}: {
  isOpen: boolean;
  title?: ReactNode;
  titleIcon?: IconDefinition;
  onTitleIconClick?: () => void;
  titleIconClassName?: string;
  onClose: () => void;
  className?: string;
  backdropClassName?: string;
  width?: number;
  children: ReactNode;
  childPadding?: boolean;
  showClose?: boolean;
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        <DialogBackdrop className={backdropClassName} />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={twMerge(
                  "w-full max-w-lg transform rounded-xl",
                  "border border-ui-panel-border bg-[#2C2C2C]",
                  "text-left align-middle shadow-xl transition-all",
                  className,
                )}
                style={{ minWidth: width }}
              >
                {title && (
                  <Dialog.Title
                    as="div"
                    className="mb-5 flex justify-between p-5 pb-0 text-xl font-bold text-white"
                  >
                    <>
                      {onTitleIconClick ? (
                        <button
                          className="flex items-center gap-3"
                          onClick={onTitleIconClick}
                        >
                          {titleIcon && (
                            <FontAwesomeIcon
                              icon={titleIcon}
                              className={titleIconClassName}
                            />
                          )}
                          {title}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          {titleIcon && (
                            <FontAwesomeIcon
                              icon={titleIcon}
                              className={titleIconClassName}
                            />
                          )}
                          {title}
                        </div>
                      )}
                    </>
                    {showClose && (
                      <Tooltip position="top" content="Close">
                        <button
                          onClick={onClose}
                          className="opacity-50 transition-opacity duration-150 hover:opacity-80 focus:outline-none"
                        >
                          <FontAwesomeIcon
                            icon={faDownLeftAndUpRightToCenter}
                          />
                        </button>
                      </Tooltip>
                    )}
                  </Dialog.Title>
                )}
                <div
                  className={`h-full ${childPadding ? "p-5 pt-0" : ""}`.trim()}
                >
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
