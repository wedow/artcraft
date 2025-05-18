import { twMerge } from "tailwind-merge";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const Spinner = ({ className }: { className?: string }) => {
  return (
    <div className={twMerge("aspect-square size-10", className)}>
      <FontAwesomeIcon
        icon={faSpinnerThird}
        className="size-full animate-spin"
      />
    </div>
  );
};
