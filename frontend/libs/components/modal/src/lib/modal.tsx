import { Fragment, ReactNode } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { CloseButton } from "@storyteller/ui-close-button";

const DialogBackdrop = ({ className }: { className?: string }) => {
  return (
    <TransitionChild
      as="div"
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={twMerge("fixed inset-0 bg-black/60", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </TransitionChild>
  );
};

export const Modal = ({
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
            <TransitionChild
              as="div"
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
              className={twMerge(
                "w-full max-w-lg transform rounded-xl relative",
                "border border-ui-panel-border bg-[#2C2C2C]",
                "text-left align-middle shadow-xl transition-all",
                childPadding ? "p-4" : "",
                className
              )}
            >
              <DialogPanel
                className="w-full relative"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {title && (
                  <DialogTitle
                    as="div"
                    className="mb-5 flex justify-between pb-0 text-xl font-bold text-white"
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
                  </DialogTitle>
                )}
                <div className={`h-full`.trim()}>{children}</div>
              </DialogPanel>
              {showClose && (
                <div className="absolute top-0 right-0 p-2.5">
                  <CloseButton onClick={onClose} />
                </div>
              )}
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
