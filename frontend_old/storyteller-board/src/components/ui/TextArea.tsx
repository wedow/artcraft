import { TextareaHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { kebabCase } from "~/utilities";

export type ResizeType =
  | "none"
  | "both"
  | "horizontal"
  | "vertical"
  | "block"
  | "inline"
  | undefined;

export interface TextareaInterface
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  resize?: ResizeType;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaInterface>(
  (
    { className, label, resize = "vertical", id, ...rest }: TextareaInterface,
    ref,
  ) => {
    return (
      <div className="flex flex-col">
        {label && <label htmlFor={id ? id : kebabCase(label)}>{label}</label>}

        <textarea
          ref={ref}
          id={id ? id : label ? kebabCase(label) : undefined}
          className={twMerge(
            "border-ui-panel-border bg-ui-controls rounded-lg border px-3 py-2",
            className,
          )}
          style={{
            outline: "2px solid transparent",
            transition: "outline-color 0.15s ease-in-out",
            resize: resize,
          }}
          onFocus={(e) => {
            // disableHotkeyInput(DomLevels.INPUT);
            e.currentTarget.style.outlineColor = "#e66462";
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
