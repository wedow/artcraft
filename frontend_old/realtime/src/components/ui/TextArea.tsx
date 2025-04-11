import { TextareaHTMLAttributes, forwardRef, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { kebabCase } from "~/utilities";

export type ResizeType =
  | "none"
  | "both"
  | "horizontal"
  | "vertical"
  | undefined;

const resizeStyles = {
  none: "resize-none",
  both: "resize",
  horizontal: "resize-x",
  vertical: "resize-y",
  undefined: "",
};

export interface TextareaInterface
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  resize?: ResizeType;
  forceBlurOnOutsideClick?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaInterface>(
  (
    {
      className,
      label,
      resize = "vertical",
      id,
      forceBlurOnOutsideClick,
      ...rest
    }: TextareaInterface,
    ref,
  ) => {
    const resizeStyle = resizeStyles[resize];
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Function to blur the textarea when clicking outside of it
    useEffect(() => {
      if (!forceBlurOnOutsideClick) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          textareaRef.current &&
          !textareaRef.current.contains(event.target as Node)
        ) {
          textareaRef.current.blur();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [forceBlurOnOutsideClick]);

    return (
      <div className="flex flex-col">
        {label && <label htmlFor={id ? id : kebabCase(label)}>{label}</label>}

        <textarea
          ref={(node) => {
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as any).current = node;
            }
            if (textareaRef) {
              (textareaRef as any).current = node;
            }
          }}
          id={id ? id : label ? kebabCase(label) : undefined}
          className={twMerge(
            "rounded-lg border border-ui-border px-4 py-2.5 text-white outline-none focus:outline-none",
            className,
            resizeStyle,
          )}
          style={{
            outline: "2px solid transparent",
          }}
          onFocus={(e) => {
            // disableHotkeyInput(DomLevels.INPUT);
            e.currentTarget.style.outlineColor = "#2d81ff";
          }}
          onBlur={(e) => {
            // enableHotkeyInput(DomLevels.INPUT);
            e.currentTarget.style.outlineColor = "transparent";
          }}
          onKeyDown={(event) => event.stopPropagation()}
          {...rest}
        />
      </div>
    );
  },
);
