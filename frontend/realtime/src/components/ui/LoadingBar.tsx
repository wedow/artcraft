import { MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import { faArrowRightRotate } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "./Button";

export enum LoadingBarStatus {
  IDLE = "idle",
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}
export interface LoadingBarProps {
  colReverse?: boolean;
  progress: number;
  status: LoadingBarStatus;
  message?: string;
  onRetry?: MouseEventHandler<HTMLButtonElement>;
}

export const LoadingBar = ({
  colReverse,
  progress = 0,
  status,
  onRetry,
  message,
}: LoadingBarProps) => {
  return (
    <div
      className={twMerge(
        // default styles
        "flex w-full flex-col gap-2",
        // position styles
        colReverse && "flex-col-reverse",
      )}
    >
      <div
        className={twMerge(
          "h-1.5 w-full rounded-full",
          status && status === LoadingBarStatus.IDLE
            ? "bg-gray-50"
            : "pointer-events-none border-0 bg-gray-600",
        )}
      >
        <div
          className={twMerge("h-full rounded-full bg-primary/80")}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex grow items-center justify-center gap-2">
        {message && <label>{message}</label>}

        {status === LoadingBarStatus.ERROR && (
          <Button
            icon={faArrowRightRotate}
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};
