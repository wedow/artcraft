import { TextareaHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import { Label } from "~/components";
import { kebabCase } from "~/utilities";
import {
  disableHotkeyInput,
  enableHotkeyInput,
  DomLevels,
} from "~/pages/PageEnigma/signals";

type ResizeType =
  | "none"
  | "both"
  | "horizontal"
  | "vertical"
  | "block"
  | "inline"
  | undefined;

export const Textarea = ({
  className,
  label,
  resize = "vertical",
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  resize?: ResizeType;
}) => {
  return (
    <div className="flex flex-col">
      {label && <Label htmlFor={id ? id : kebabCase(label)}>{label}</Label>}

      <textarea
        id={id ? id : label ? kebabCase(label) : undefined}
        className={twMerge(
          "rounded-lg border border-[#363636] bg-brand-secondary px-3 py-2 placeholder-white/50 outline-none transition-all duration-150 ease-in-out hover:border-brand-primary/60 focus:border-brand-primary focus:outline-none",
          className,
        )}
        style={{
          resize: resize,
        }}
        onFocus={() => {
          disableHotkeyInput(DomLevels.INPUT);
        }}
        onBlur={() => {
          enableHotkeyInput(DomLevels.INPUT);
        }}
        onKeyDown={(event) => event.stopPropagation()}
        {...rest}
      />
    </div>
  );
};
