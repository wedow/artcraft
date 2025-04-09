import { faStopwatch } from "@fortawesome/pro-solid-svg-icons";
import { Button, Tooltip } from "~/components/ui";

export const ButtonTrimDuration = ({
  trimDurationMs,
  onChange,
}: {
  trimDurationMs: number;
  onChange: (newTrimDuration: number) => void;
}) => {
  const handleOnClick = () => {
    if (trimDurationMs === 6000) {
      onChange(3000);
      return;
    }
    if (trimDurationMs === 3000) {
      onChange(1000);
      return;
    }
    onChange(6000);
    return;
  };
  return (
    <Tooltip tip="Change max trim time">
      <Button className="h-8" icon={faStopwatch} onClick={handleOnClick}>
        <span className="-ml-1 mt-0.5 w-4">{trimDurationMs / 1000}s</span>
      </Button>
    </Tooltip>
  );
};
