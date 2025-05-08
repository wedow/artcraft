import { faArrowsRotate } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface ToggleButtonProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  icons?: { [key: string]: IconDefinition };
}

export const ToggleButton = ({
  label,
  value,
  onChange,
  options = ["1", "2", "3"],
  icons,
}: ToggleButtonProps) => {
  const handleClick = () => {
    const currentIndex = options.indexOf(value);
    const nextIndex = (currentIndex + 1) % options.length;
    onChange(options[nextIndex]);
  };

  return (
    <Button
      icon={icons?.[value] ?? faArrowsRotate}
      variant="secondary"
      className="glass px-3 py-1.5"
      onClick={handleClick}
    >
      {label && (
        <>
          {label} <span className="opacity-60">—</span>
        </>
      )}{" "}
      {value}
    </Button>
  );
};
