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
import { useRef, useState, useEffect, useContext, createContext } from "react";
import { cloneElement, isValidElement } from "react";
import {
  faUpRightAndDownLeftFromCenter,
  faDownLeftAndUpRightToCenter,
} from "@fortawesome/pro-solid-svg-icons";
import { DomLevels } from "@storyteller/common";

const DialogBackdrop = ({
  className,
  onClose,
  closeOnOutsideClick,
  disableHotkeyInput,
  enableHotkeyInput,
}: {
  className?: string;
  onClose?: () => void;
  closeOnOutsideClick?: boolean;
  disableHotkeyInput: (level: number) => void;
  enableHotkeyInput: (level: number) => void;
}) => {
  useEffect(() => {
    disableHotkeyInput(DomLevels.DIALOGUE);
    return () => {
      enableHotkeyInput(DomLevels.DIALOGUE);
    };
  }, []);
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
        className={twMerge("fixed inset-0 bg-black/60 z-[69]", className)}
        onMouseDown={(e) => {
          if (closeOnOutsideClick && onClose) {
            // Only trigger if click is directly on the backdrop, not on children
            if (e.target === e.currentTarget) {
              onClose();
            }
          }
        }}
      />
    </TransitionChild>
  );
};

// Drag handle subcomponent
const DragHandle = ({ children }: { children: ReactNode }) => <>{children}</>;

// Context for expanded state
interface ModalExpandContextType {
  expanded: boolean;
  toggleExpanded: () => void;
}
const ModalExpandContext = createContext<ModalExpandContextType | undefined>(
  undefined
);

// Expand button subcomponent
interface ExpandButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ExpandButton = ({ className, size = "md" }: ExpandButtonProps) => {
  const ctx = useContext(ModalExpandContext);
  if (!ctx) return null;
  const { expanded, toggleExpanded } = ctx;
  const sizeClasses = {
    sm: "h-5 w-5 text-sm",
    md: "h-7 w-7 text-md",
    lg: "h-9 w-9 text-xl",
  };
  return (
    <button
      type="button"
      aria-label={expanded ? "Restore modal size" : "Expand modal"}
      onClick={toggleExpanded}
      className={twMerge(
        "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
        sizeClasses[size],
        "relative z-[70]",
        className
      )}
    >
      <FontAwesomeIcon
        icon={
          expanded
            ? faDownLeftAndUpRightToCenter
            : faUpRightAndDownLeftFromCenter
        }
      />
    </button>
  );
};

ExpandButton.displayName = "ModalExpandButton";

export const Modal = ({
  isOpen,
  title,
  titleIcon,
  onTitleIconClick,
  onClose,
  disableHotkeyInput = () => {},
  enableHotkeyInput = () => {},
  className,
  backdropClassName,
  width,
  children,
  childPadding = true,
  titleIconClassName,
  showClose = true,
  draggable = false,
  initialPosition,
  closeOnOutsideClick = true,
  allowBackgroundInteraction = false,
  expandable = false,
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
  draggable?: boolean;
  disableHotkeyInput?: (level: number) => void;
  enableHotkeyInput?: (level: number) => void;
  /**
   * Optional initial position for the modal (only used on first open, if no previous position is stored)
   */
  initialPosition?: { x: number; y: number };
  /**
   * If false, clicking the backdrop will NOT close the modal
   */
  closeOnOutsideClick?: boolean;
  /**
   * If true, allow interacting with background (removes pointer events from backdrop)
   */
  allowBackgroundInteraction?: boolean;
  /**
   * If true, show expand button and allow expanding modal to fill window
   */
  expandable?: boolean;
}) => {
  // Draggable logic
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<{ x: number; y: number } | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Expanded state
  const [expanded, setExpanded] = useState(false);
  // Track last non-expanded position
  const lastNonExpandedPosition = useRef<{ x: number; y: number } | null>(null);
  // When expanding/restoring, update position
  useEffect(() => {
    if (expanded) {
      // Save last non-expanded position
      if (positionRef.current) {
        lastNonExpandedPosition.current = { ...positionRef.current };
      }
      // Set position to (0,0) for fullscreen
      setPosition({ x: 0, y: 0 });
      positionRef.current = { x: 0, y: 0 };
      if (modalRef.current) {
        modalRef.current.style.left = "0px";
        modalRef.current.style.top = "0px";
        modalRef.current.style.margin = "0";
        modalRef.current.style.position = "fixed";
        modalRef.current.style.zIndex = "70";
      }
    } else {
      // Restore last non-expanded position
      if (lastNonExpandedPosition.current) {
        setPosition({ ...lastNonExpandedPosition.current });
        positionRef.current = { ...lastNonExpandedPosition.current };
        if (modalRef.current) {
          modalRef.current.style.left =
            lastNonExpandedPosition.current.x + "px";
          modalRef.current.style.top = lastNonExpandedPosition.current.y + "px";
          modalRef.current.style.margin = "0";
          modalRef.current.style.position = "fixed";
          modalRef.current.style.zIndex = "70";
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);
  const toggleExpanded = () => setExpanded((v) => !v);

  // Reset position when modal is closed or opened
  useEffect(() => {
    if (!isOpen) {
      // Don't reset position, just store the last position
      if (positionRef.current)
        lastPositionRef.current = { ...positionRef.current };
      // setPosition(null); // Don't reset position
      // positionRef.current = null; // Don't reset position
    } else {
      // When opening, restore last position if available
      if (lastPositionRef.current) {
        setPosition({ ...lastPositionRef.current });
        positionRef.current = { ...lastPositionRef.current };
        // Set DOM node style as well
        if (modalRef.current) {
          modalRef.current.style.left = lastPositionRef.current.x + "px";
          modalRef.current.style.top = lastPositionRef.current.y + "px";
          modalRef.current.style.margin = "0";
          modalRef.current.style.position = "fixed";
          modalRef.current.style.zIndex = "70";
        }
      } else if (initialPosition) {
        setPosition({ ...initialPosition });
        positionRef.current = { ...initialPosition };
        if (modalRef.current) {
          modalRef.current.style.left = initialPosition.x + "px";
          modalRef.current.style.top = initialPosition.y + "px";
          modalRef.current.style.margin = "0";
          modalRef.current.style.position = "fixed";
          modalRef.current.style.zIndex = "70";
        }
      }
    }
  }, [isOpen]);

  // Handle mouse move and up events
  useEffect(() => {
    if (!dragging) return;
    let animationFrame: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (!modalRef.current) return;
      const dx = e.clientX - mouseStart.current.x;
      const dy = e.clientY - mouseStart.current.y;
      const newX = dragStart.current.x + dx;
      const newY = dragStart.current.y + dy;
      // Restrict within viewport, but allow overflow
      const modal = modalRef.current;
      const { width: mw, height: mh } = modal.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const overflow = 450; // Allow dragging 450px outside each edge except top
      const minX = -overflow;
      const minY = 0; // Do not allow dragging above the top edge
      const maxX = vw - mw + overflow;
      const maxY = vh - mh + overflow;
      const clampedX = Math.max(minX, Math.min(newX, maxX));
      const clampedY = Math.max(minY, Math.min(newY, maxY));
      positionRef.current = { x: clampedX, y: clampedY };
      if (modalRef.current) {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          if (modalRef.current && positionRef.current) {
            modalRef.current.style.left = positionRef.current.x + "px";
            modalRef.current.style.top = positionRef.current.y + "px";
            modalRef.current.style.margin = "0";
            modalRef.current.style.position = "fixed";
            modalRef.current.style.zIndex = "70";
          }
        });
      }
    };
    const handleMouseUp = () => {
      setDragging(false);
      // Update React state to the last position for next drag
      if (positionRef.current) setPosition({ ...positionRef.current });
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [dragging]);

  // Center modal if not being dragged
  const getModalStyle = (): React.CSSProperties => {
    if (!draggable || !position) {
      // If allowBackgroundInteraction, set pointerEvents: 'auto' for modal
      return allowBackgroundInteraction ? { pointerEvents: "auto" } : {};
    }
    return {
      position: "fixed",
      left: position.x,
      top: position.y,
      margin: 0,
      zIndex: 70,
      ...(allowBackgroundInteraction ? { pointerEvents: "auto" } : {}),
    };
  };

  // Calculate initial center position on first drag
  const handleDragStart = (e: React.MouseEvent) => {
    if (!modalRef.current) return;
    if (expanded) setExpanded(false); // Un-expand on drag
    e.preventDefault();
    e.stopPropagation();
    const modal = modalRef.current;
    const { width: mw, height: mh } = modal.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = positionRef.current?.x ?? position?.x;
    let y = positionRef.current?.y ?? position?.y;
    if (x === undefined || y === undefined) {
      if (initialPosition) {
        x = initialPosition.x;
        y = initialPosition.y;
      } else {
        x = (vw - mw) / 2;
        y = (vh - mh) / 2;
      }
    }
    dragStart.current = { x, y };
    mouseStart.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    // If position is not set, set it to center or last or initial
    if (!position && !positionRef.current) {
      setPosition({ x, y });
      positionRef.current = { x, y };
      if (modalRef.current) {
        modalRef.current.style.left = x + "px";
        modalRef.current.style.top = y + "px";
        modalRef.current.style.margin = "0";
        modalRef.current.style.position = "fixed";
        modalRef.current.style.zIndex = "70";
      }
    }
  };

  // Find and enhance the drag handle
  let enhancedChildren = children;
  if (draggable) {
    let foundHandle = false;
    enhancedChildren = Array.isArray(children)
      ? children.map((child) => {
          if (
            !foundHandle &&
            isValidElement(child) &&
            (child.type === DragHandle ||
              (child.type as any).displayName === "ModalDragHandle")
          ) {
            foundHandle = true;
            const typedChild = child as React.ReactElement<{
              children: ReactNode;
            }>;
            return cloneElement(typedChild, {
              children: (
                <div
                  style={{ cursor: "move", userSelect: "none" }}
                  onMouseDown={handleDragStart}
                >
                  {typedChild.props.children}
                </div>
              ),
            });
          }
          return child;
        })
      : isValidElement(children) &&
        (children.type === DragHandle ||
          (children.type as any).displayName === "ModalDragHandle")
      ? (() => {
          const typedChildren = children as React.ReactElement<{
            children: ReactNode;
          }>;
          return cloneElement(typedChildren, {
            children: (
              <div
                style={{ cursor: "move", userSelect: "none" }}
                onMouseDown={handleDragStart}
              >
                {typedChildren.props.children}
              </div>
            ),
          });
        })()
      : children;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[70]"
        onClose={onClose}
        static={allowBackgroundInteraction}
      >
        <div
          className="fixed inset-0"
          style={
            allowBackgroundInteraction ? { pointerEvents: "none" } : undefined
          }
        >
          {/* Backdrop always rendered first in stacking context */}
          {!allowBackgroundInteraction && (
            <DialogBackdrop
              className={backdropClassName}
              onClose={onClose}
              closeOnOutsideClick={closeOnOutsideClick}
              disableHotkeyInput={disableHotkeyInput}
              enableHotkeyInput={enableHotkeyInput}
            />
          )}
          {allowBackgroundInteraction && (
            <div
              className={twMerge("fixed inset-0 z-[69]", backdropClassName)}
              style={{ pointerEvents: "none" }}
            />
          )}
          <ModalExpandContext.Provider value={{ expanded, toggleExpanded }}>
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
                  "w-full max-w-lg transform rounded-xl relative border border-ui-panel-border bg-[#2C2C2C] text-left align-middle shadow-2xl z-[70]",
                  childPadding && !expanded ? "p-4" : "",
                  className,
                  dragging && !expanded ? "!transition-none" : "transition-all",
                  expanded &&
                    "w-screen h-screen max-w-screen max-h-screen rounded-none"
                )}
                ref={modalRef}
                style={getModalStyle()}
              >
                <DialogPanel className="w-full h-full">
                  {title && (
                    <DialogTitle
                      as="div"
                      className={twMerge(
                        "mb-5 flex justify-between pb-0 text-xl font-bold text-white"
                      )}
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
                  <div className={`h-full`.trim()}>{enhancedChildren}</div>
                </DialogPanel>
                {showClose && (
                  <div className="absolute top-0 right-0 p-2.5">
                    <CloseButton onClick={onClose} />
                  </div>
                )}
              </TransitionChild>
            </div>
          </ModalExpandContext.Provider>
        </div>
      </Dialog>
    </Transition>
  );
};

Modal.DragHandle = DragHandle;
(Modal.DragHandle as any).displayName = "ModalDragHandle";

Modal.ExpandButton = ExpandButton;
ExpandButton.displayName = "ModalExpandButton";
