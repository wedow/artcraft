import { Field, Label, Switch as HeadlessUiSwitch } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

export const Switch = ({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean | "semi";
  label?: string;
  onChange: (newState: boolean) => void;
}) => {
  const labelDisabledStyles = disabled ? "opacity-50" : "";
  const switchContainerBaseStyle =
    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-indigo-500 focus:ring-offset-0";
  const switchContainerStateStyle = checked
    ? "bg-primary hover:bg-primary-400"
    : "bg-gray-500 hover:bg-gray-400";
  const switchButtonBaseStyle =
    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform";
  const switchButtonStateStyle = checked ? "translate-x-6" : "translate-x-1";

  return (
    <Field className="flex items-center">
      {label && (
        <Label
          className={twMerge(
            "mr-3 grow text-sm font-medium transition-opacity",
            labelDisabledStyles,
          )}
        >
          {label}
        </Label>
      )}
      <HeadlessUiSwitch
        disabled={disabled === "semi" ? false : disabled}
        checked={checked}
        onChange={onChange}
        className={twMerge(switchContainerBaseStyle, switchContainerStateStyle)}
      >
        <span
          className={twMerge(switchButtonBaseStyle, switchButtonStateStyle)}
        />
      </HeadlessUiSwitch>
    </Field>
  );
};
