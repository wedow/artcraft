import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

interface ButtonIconStackProps {
  icon: IconDefinition;
  text: string;
  onClick?: () => void;
  style?: string;
  additionalStyle?: string;
}

export function ButtonIconStack({
  icon,
  text = "",
  onClick,
  style,
  additionalStyle,
}: ButtonIconStackProps) {

  const defaultStyle = twMerge(
    "flex flex-col items-center justify-center text-xs transition-all duration-150",
    "h-full w-full gap-1 p-2",
    additionalStyle
  )


  return (
    <button
      className={style ?? defaultStyle}
      onClick={onClick}
    >
      <FontAwesomeIcon icon={icon} size="xl" />
      {text && (
        <span className="text-nowrap text-xs font-medium">{text}</span>
      )}
    </button>
  );
}
