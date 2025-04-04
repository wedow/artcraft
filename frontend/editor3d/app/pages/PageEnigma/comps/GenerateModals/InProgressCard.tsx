import { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faCircleExclamation,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";

import { ToastTypes } from "~/enums";
import { addToast } from "~/signals";

import { JobState } from "~/pages/PageEnigma/enums";
import { ActiveJob } from "~/pages/PageEnigma/models";

import { Tooltip } from "~/components";
import { JobsApi } from "~/Classes/ApiManager";
import { PollRecentJobs } from "~/hooks/useActiveJobs/utilities";
import { getStyleName } from "~/pages/PageEnigma/comps/GenerateModals/CompletedCard";
interface Props {
  movie: ActiveJob;
}

function getPercent(status: JobState, percentage: number) {
  if (
    [
      JobState.COMPLETE_FAILURE,
      JobState.ATTEMPT_FAILED,
      JobState.DEAD,
    ].includes(status)
  ) {
    return 0;
  } else {
    return percentage;
  }
}

export function InProgressCard({ movie }: Props) {
  const completePercent = getPercent(
    movie.status.status as JobState,
    movie.status.progress_percentage,
  );
  const completeLength = (600 * completePercent) / 100;

  const deleteJob = useCallback(async (movieJob: ActiveJob) => {
    const jobsApi = new JobsApi();

    const response = await jobsApi.DeleteJobByToken(movieJob.job_token);
    if (response.success) {
      PollRecentJobs();
      addToast(ToastTypes.SUCCESS, "File successfully deleted.");
      return;
    }

    addToast(
      ToastTypes.ERROR,
      response.errorMessage || "Error deleting the file.",
    );
  }, []);

  return (
    <div className="flex w-full items-center justify-between rounded-lg p-2 text-start transition-all duration-150 hover:bg-white/10">
      <div className="flex gap-4">
        <div className="flex aspect-square h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#A9A9A9]/50 bg-black/60">
          {(movie.status.status === JobState.STARTED ||
            movie.status.status === JobState.PENDING) && (
            <FontAwesomeIcon icon={faSpinnerThird} spin size={"lg"} />
          )}
          {(movie.status.status === JobState.COMPLETE_FAILURE ||
            movie.status.status === JobState.ATTEMPT_FAILED) && (
            <FontAwesomeIcon icon={faCircleExclamation} size={"lg"} />
          )}
        </div>
        <div className="flex flex-col justify-center gap-1">
          <div className="font-medium">
            {movie.request.maybe_model_title || "Untitled"}
          </div>
          <div className="font-medium">
            {getStyleName(movie.request.maybe_style_name) || "Untitled"}
          </div>
          <div className="relative block h-[6px] w-[560px] overflow-hidden rounded-lg bg-white/10">
            <div
              className="absolute inset-0 block h-[6px] rounded-lg bg-brand-primary"
              style={{ width: completeLength }}
            />
          </div>
          <div className="text-sm capitalize text-white/60">
            {movie.status.status.replaceAll("_", " ")}... {completePercent}%
          </div>
        </div>
      </div>

      {movie.status.status !== JobState.STARTED && (
        <div className="pr-5">
          <Tooltip content="Cancel" position="top">
            <button
              onClick={() => deleteJob(movie)}
              className="text-[15px] font-medium text-white/50 transition-all duration-150 hover:text-white/100"
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
