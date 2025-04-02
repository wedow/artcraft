import { ReactNode } from "react";
import { Popover, Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { Button } from "../Button";

export interface PopoverItem {
  label: string;
  selected: boolean;
  icon?: ReactNode;
  action?: string;
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
  onAction?: (action: string) => void;
  panelTitle?: string;
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
  onAction,
  panelTitle,
}: PopoverMenuProps) => {
  const selectedItem = items.find((item) => item.selected);

  const handleItemClick = (item: PopoverItem) => {
    if (mode === "button" && item.action && onAction) {
      onAction(item.action);
    } else {
      onSelect?.(item);
    }
  };

  const className = twMerge(
    "text-sm font-medium rounded-lg px-3 py-2 shadow-sm",
    "flex gap-2 items-center justify-center outline-none",
    "transition-all duration-150",
    "bg-[#5F5F68]/60 px-3 text-white backdrop-blur-lg hover:bg-[#5F5F68]/90",
    buttonClassName,
  );

  return (
    <Popover className="relative">
      <Popover.Button className={className}>
        {triggerIcon}
        {mode === "toggle" && selectedItem ? selectedItem.label : null}
        {mode === "default" && triggerLabel ? triggerLabel : null}
      </Popover.Button>

      <div className="absolute bottom-full left-0 transform-gpu">
        <Transition
          enter="transition duration-100 ease-out"
          enterFrom="translate-y-2 opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="transition duration-100 ease-in"
          leaveFrom="translate-y-0 opacity-100"
          leaveTo="translate-y-2 opacity-0"
        >
          <Popover.Panel className="origin-bottom">
            <div
              className={twMerge(
                "z-10 mb-2 min-w-48 rounded-lg bg-[#46464B] p-1.5 shadow-lg",
              )}
            >
              {panelTitle && (
                <div className="mb-2 mt-0.5 px-1.5 text-sm font-normal text-white opacity-70">
                  {panelTitle}
                </div>
              )}
              {mode === "default" && children ? (
                <div className="text-sm text-white">{children}</div>
              ) : (
                <div className="flex flex-col gap-0 text-sm text-white">
                  {items.map((item, index) => (
                    <Button
                      key={index}
                      className={`flex items-center justify-between border-transparent bg-transparent px-1.5 hover:bg-[#63636B]/60 ${mode === "toggle" && item.selected ? "hover:bg-[#63636B]" : "bg-transparent"}`}
                      onClick={() => handleItemClick(item)}
                      variant="secondary"
                    >
                      <div className="flex items-center gap-2">
                        {showIconsInList && item.icon}
                        {item.label}
                      </div>
                      {mode === "toggle" && (
                        <input type="radio" checked={item.selected} readOnly />
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
    </Popover>
  );
};
