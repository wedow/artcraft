import React from "react";
import { twMerge } from "tailwind-merge";
import { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Label, H6 } from "~/components";
import { kebabCase } from "~/utilities";
import {
  disableHotkeyInput,
  enableHotkeyInput,
  DomLevels,
} from "~/pages/PageEnigma/signals";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string;
  iconClassName?: string;
  label?: string;
  icon?: IconDefinition;
  isError?: boolean;
  errorMessage?: string;
}

export const Input = React.forwardRef(
  (
    {
      label,
      icon,
      inputClassName,
      iconClassName,
      className,
      id,
      isError,
      onBlur,
      onFocus,
      errorMessage,
      ...rest
    }: InputProps,
    ref: React.ForwardedRef<HTMLInputElement>,
  ) => {
    return (
      <div className={twMerge("flex flex-col", className)}>
        {label && <Label htmlFor={id ? id : kebabCase(label)}>{label}</Label>}

        <div className="relative w-full">
          {icon && (
            <FontAwesomeIcon
              icon={icon}
              className={twMerge("text-md absolute pl-3 pt-3", iconClassName)}
            />
          )}
          <input
            ref={ref}
            id={id ? id : label ? kebabCase(label) : undefined}
            className={twMerge(
              "h-10 w-full rounded-lg bg-brand-secondary/80 px-3 py-2.5 text-white placeholder-white/50 outline-none",
              "border border-[#363636] transition-all duration-150 ease-in-out hover:border-brand-primary/60 focus:border-brand-primary focus:!outline-none",
              icon && "pl-10",
              isError && "outline-red focus:outline-red",
              inputClassName,
            )}
            onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
              if (onFocus) {
                onFocus(e);
              }
              disableHotkeyInput(DomLevels.INPUT);
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              if (onBlur) {
                onBlur(e);
              }
              enableHotkeyInput(DomLevels.INPUT);
            }}
            {...rest}
          />
          {errorMessage && (
            <H6 className="absolute z-10 text-red">{errorMessage}</H6>
          )}
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";
