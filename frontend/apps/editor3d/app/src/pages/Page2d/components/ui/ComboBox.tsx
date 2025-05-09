import { useState } from "react";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Combobox as HeadlessComboBox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";

interface ComboBoxInterface {
  options: string[];
  value: string;
  onChange: (newVal: string) => void;
}
export const Combobox = ({ options, value, onChange }: ComboBoxInterface) => {
  const [query, setQuery] = useState("");
  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          return option.toLowerCase().includes(option.toLowerCase());
        });

  return (
    <HeadlessComboBox
      value={value}
      onChange={onChange}
      onClose={() => setQuery("")}
    >
      <div className="relative flex h-10 rounded-lg border border-ui-panel-border">
        <ComboboxInput
          className="rounded-lg px-3"
          displayValue={(font: string) => font}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxButton className="absolute right-0 top-0 flex h-10 items-center justify-center px-3 transition-colors duration-300 hover:text-primary">
          <FontAwesomeIcon icon={faChevronDown} className="size-4" />
        </ComboboxButton>
      </div>
      <ComboboxOptions
        anchor="bottom"
        className="mt-1 w-[var(--input-width)] rounded-lg border border-ui-panel-border empty:invisible"
      >
        {filteredOptions.map((option, idx) => (
          <ComboboxOption
            key={idx}
            value={option}
            className="bg-ui-controls cursor-pointer px-3 py-2 data-[focus]:bg-gray-600 data-[selected]:font-medium"
          >
            {option}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </HeadlessComboBox>
  );
};
