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
          "h-2.5 w-full rounded-full",
          status && status === LoadingBarStatus.IDLE
            ? "border-1 bg-gray-50 ring-1 ring-inset ring-gray-200"
            : "bg-gray-200",
        )}
      >
        <div
          className={twMerge(
            "h-2.5 rounded-full bg-primary-500",
            status === LoadingBarStatus.LOADING && "animate-pulse",
          )}
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
