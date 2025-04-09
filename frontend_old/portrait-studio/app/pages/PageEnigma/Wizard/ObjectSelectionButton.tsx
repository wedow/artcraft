import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { H4, LoadingSpinner } from "~/components";

interface ObjectSelectionButtonProps {
  onClick: () => void;
  label: string;
  imageSrc: string;
  busy: boolean;
  disabled?: boolean;
}

export function ObjectSelectionButton({
  onClick,
  label,
  imageSrc,
  busy,
  disabled,
}: ObjectSelectionButtonProps) {
  return (
    <div className="flex flex-col">
      <button
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/30 bg-ui-controls-button/70 p-2 pr-3 text-start transition-all hover:border-brand-primary hover:bg-ui-controls-button/60"
        onClick={onClick}
        disabled={disabled}
      >
        <div className="aspect-video w-20 overflow-hidden rounded-md bg-ui-controls-button/100">
          {busy ? (
            <LoadingSpinner />
          ) : (
            <img crossOrigin="anonymous" src={imageSrc} alt={label} />
          )}
        </div>
        <div className="grow">
          <>
            <H4>{label}</H4>
          </>
        </div>
        <FontAwesomeIcon icon={faChevronRight} className="text-xl opacity-60" />
      </button>
    </div>
  );
}
