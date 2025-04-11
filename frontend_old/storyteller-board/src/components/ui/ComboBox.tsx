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
      <div className="relative flex h-10 rounded-md border">
        <ComboboxInput
          className="rounded-md"
          displayValue={(font: string) => font}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxButton className="absolute right-0 top-0 flex h-10 items-center justify-center hover:text-primary">
          <FontAwesomeIcon icon={faChevronDown} className="size-4 p-2" />
        </ComboboxButton>
      </div>
      <ComboboxOptions
        anchor="bottom"
        className="mt-1 w-[var(--input-width)] rounded-lg border empty:invisible"
      >
        {filteredOptions.map((option, idx) => (
          <ComboboxOption
            key={idx}
            value={option}
            className="cursor-pointer bg-white p-2 data-[focus]:bg-primary-200 data-[selected]:font-medium"
          >
            {option}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </HeadlessComboBox>
  );
};
