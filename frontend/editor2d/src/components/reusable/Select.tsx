import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { faCheck, faChevronDown } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MediaFileAnimationType } from "~/enums";

export type SelectValue = string | number;
export type SelectOption = { label: string; value: SelectValue };

interface ListDropdownProps {
  options: SelectOption[];
  onChange: (val: MediaFileAnimationType) => void;
  placeholder?: string;
  value?: SelectValue;
}
export const Select = ({
  onChange,
  options,
  placeholder,
  value,
}: ListDropdownProps) => {
  const selectedOption = options.find(
    (option: SelectOption) => option.value === value,
  ) || { label: placeholder || "", value: "" };
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative mt-1">
        <Listbox.Button className="relative h-10 w-full cursor-pointer rounded-md bg-brand-secondary py-2 pl-3 pr-10 text-left outline-none outline-offset-0 transition-all duration-150 ease-in-out focus:outline-brand-primary sm:text-sm">
          <span className={`block truncate${value ? "" : " opacity-50"}`}>
            {selectedOption.label}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-brand-secondary py-1 text-base shadow-lg focus:outline-none sm:text-sm">
            {options.map((option, itemIdx) => (
              <Listbox.Option
                key={itemIdx}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4  text-white ${
                    active ? "text-white" : "text-gray-400"
                  }`
                }
                value={option.value}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {option.label}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};
