import { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faCircleExclamation,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";

interface Props {
  job: {
    job_token: string;
    request: {
      maybe_model_title: string;
    };
    status: {
      status: string;
      progress_percentage: number;
    };
  };
}

function getPercent(status: string, percentage: number) {
  if (["COMPLETE_FAILURE", "ATTEMPT_FAILED", "DEAD"].includes(status)) {
    return 0;
  } else {
    return percentage;
  }
}

export function InProgressCard({ job }: Props) {
  const completePercent = getPercent(
    job.status.status,
    job.status.progress_percentage,
  );

  const deleteJob = useCallback(async (jobToDelete: Props["job"]) => {
    // Simulate API call
    console.log("Deleting job:", jobToDelete.job_token);
  }, []);

  return (
    <div className="flex w-full items-center justify-between rounded-lg p-2 text-start transition-all duration-150 hover:bg-white/10">
      <div className="flex gap-4">
        <div className="flex aspect-square h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#A9A9A9]/50 bg-black/60">
          {(job.status.status === "STARTED" ||
            job.status.status === "PENDING") && (
            <FontAwesomeIcon icon={faSpinnerThird} spin size={"lg"} />
          )}
          {(job.status.status === "COMPLETE_FAILURE" ||
            job.status.status === "ATTEMPT_FAILED") && (
            <FontAwesomeIcon icon={faCircleExclamation} size={"lg"} />
          )}
        </div>
        <div className="flex flex-col justify-center gap-1">
          <div className="font-medium">
            {job.request.maybe_model_title || "Untitled"}
          </div>

          <div className="text-sm capitalize text-white/60">
            {job.status.status.split("_").join(" ")}... {completePercent}%
          </div>
        </div>
      </div>

      {job.status.status !== "STARTED" && (
        <div className="pr-5">
          <button
            onClick={() => deleteJob(job)}
            className="text-[15px] font-medium text-white/50 transition-all duration-150 hover:text-white/100"
            title="Cancel"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
      )}
    </div>
  );
}
