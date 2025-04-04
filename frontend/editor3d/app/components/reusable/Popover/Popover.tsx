import { ReactNode } from "react";
import { Popover, Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { Button } from "../Button";

export interface PopoverItem {
  label: string;
  selected: boolean;
  icon?: ReactNode;
  action?: string;
  disabled?: boolean;
}

interface PopoverMenuProps {
  items?: PopoverItem[];
  onSelect?: (item: PopoverItem) => void;
  onAdd?: () => void;
  triggerIcon?: ReactNode;
  showAddButton?: boolean;
  showIconsInList?: boolean;
  mode?: "default" | "toggle" | "button";
  triggerLabel?: string;
  children?: ReactNode;
  buttonClassName?: string;
  panelClassName?: string;
  onPanelAction?: (action: string) => void;
  panelTitle?: string;
  position?: "top" | "bottom";
  align?: "start" | "center" | "end";
  panelActionLabel?: string;
}

export const PopoverMenu = ({
  items = [],
  onSelect,
  onAdd,
  triggerIcon,
  showAddButton = false,
  showIconsInList = false,
  mode = "default",
  triggerLabel,
  children,
  buttonClassName,
  panelClassName,
  onPanelAction,
  panelTitle,
  position = "top",
  align = "start",
  panelActionLabel,
}: PopoverMenuProps) => {
  const selectedItem = items.find((item) => item.selected);

  const handleItemClick = (item: PopoverItem, close: () => void) => {
    if (mode === "button" && item.action && onPanelAction) {
      onPanelAction(item.action);
      close();
    } else {
      onSelect?.(item);
      close();
    }
  };

  const className = twMerge(
    "text-sm font-medium rounded-lg px-3 py-2 shadow-sm",
    "flex gap-2 items-center justify-center outline-none",
    "transition-all duration-150",
    "bg-[#5F5F68]/60 px-3 text-white backdrop-blur-lg hover:bg-[#5F5F68]/90",
    buttonClassName,
  );

  const positionClasses = {
    top: "bottom-full",
    bottom: "top-full",
  };

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  return (
    <Popover className="relative">
      {({ close }) => (
        <>
          <Popover.Button className={className}>
            {triggerIcon}
            {mode === "toggle" && selectedItem ? selectedItem.label : null}
            {mode === "default" && triggerLabel ? triggerLabel : null}
          </Popover.Button>

          <div
            className={twMerge(
              "absolute transform-gpu",
              positionClasses[position],
              alignClasses[align],
            )}
          >
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom={
                position === "bottom"
                  ? "translate-y-2 opacity-0"
                  : "-translate-y-2 opacity-0"
              }
              enterTo="translate-y-0 opacity-100"
              leave="transition duration-100 ease-in"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo={
                position === "bottom"
                  ? "translate-y-2 opacity-0"
                  : "-translate-y-2 opacity-0"
              }
            >
              <Popover.Panel
                className={twMerge(
                  position === "bottom" ? "origin-top" : "origin-bottom",
                )}
              >
                <div
                  className={twMerge(
                    "z-10 min-w-48 rounded-lg bg-[#46464B] p-1.5 shadow-lg",
                    position === "top" && "mb-2",
                    position === "bottom" && "mt-2",
                    panelClassName,
                  )}
                >
                  {panelTitle && (
                    <div className="mb-2 mt-0.5 flex justify-between px-1.5 text-sm font-normal text-white opacity-70">
                      {panelTitle}
                      {panelActionLabel && (
                        <button
                          onClick={() => {
                            onPanelAction?.(panelActionLabel);
                            close();
                          }}
                          className="text-end text-sm text-white/85 hover:underline"
                        >
                          {panelActionLabel}
                        </button>
                      )}
                    </div>
                  )}
                  {mode === "default" && children ? (
                    <div className="text-sm text-white">{children}</div>
                  ) : (
                    <div className="flex flex-col gap-0 text-sm text-white">
                      {items.map((item, index) => (
                        <Button
                          key={index}
                          className={twMerge(
                            "flex items-center justify-between border-transparent bg-transparent px-1.5",
                            "hover:bg-[#63636B]/60",
                            mode === "toggle" && item.selected
                              ? "hover:bg-[#63636B]"
                              : "bg-transparent",
                            item.disabled
                              ? "!cursor-not-allowed opacity-50"
                              : "",
                          )}
                          onClick={() =>
                            !item.disabled && handleItemClick(item, close)
                          }
                          variant="secondary"
                          disabled={item.disabled}
                        >
                          <div className="flex items-center gap-2">
                            {showIconsInList && item.icon}
                            {item.label}
                          </div>
                          {mode === "toggle" && (
                            <input
                              type="radio"
                              checked={item.selected}
                              readOnly
                            />
                          )}
                        </Button>
                      ))}
                      {showAddButton && onAdd && (
                        <Button
                          variant="secondary"
                          className="mb-0.5 mt-2 border-none bg-[#7B7B84] py-1 hover:bg-[#8c8c96]"
                          onClick={onAdd}
                        >
                          + Add
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </div>
        </>
      )}
    </Popover>
  );
};
