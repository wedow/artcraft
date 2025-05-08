import React from "react";
import { twMerge } from "tailwind-merge";
import { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Label } from "@storyteller/ui-label";

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
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <div className={twMerge("flex flex-col", className)}>
        {label && <Label htmlFor={id ? id : label}>{label}</Label>}

        <div className="relative w-full">
          {icon && (
            <FontAwesomeIcon
              icon={icon}
              className={twMerge("text-md absolute pl-3 pt-3", iconClassName)}
            />
          )}
          <input
            ref={ref}
            id={id ? id : label ? label : undefined}
            className={twMerge(
              "h-10 w-full rounded-lg bg-[#242424] px-3 py-2.5 text-white placeholder-white/50 outline-none",
              "border border-[#363636] transition-all duration-150 ease-in-out hover:border-primary/60 focus:border-primary focus:!outline-none",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#363636]",
              icon && "pl-10",
              isError && "outline-red focus:outline-red",
              inputClassName
            )}
            onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
              if (onFocus) {
                onFocus(e);
              }
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              if (onBlur) {
                onBlur(e);
              }
            }}
            {...rest}
          />
          {errorMessage && (
            <h6 className="absolute z-10 text-red">{errorMessage}</h6>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
