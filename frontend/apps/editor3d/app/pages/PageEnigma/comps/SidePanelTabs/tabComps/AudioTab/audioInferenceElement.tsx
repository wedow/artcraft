import { useCallback } from "react";
import { twMerge } from "tailwind-merge";
import {
  faSpinnerThird,
  faCircleExclamation,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { JobsApi } from "~/Classes/ApiManager";
import { JobStatus, ToastTypes } from "~/enums";
import { Job } from "~/models";
import { ButtonIcon, H5 } from "~/components";
import { addToast } from "~/signals";
import { isJobStatusError } from "~/utilities";
import { PollRecentJobs } from "~/hooks/useActiveJobs/utilities";

export const InferenceElement = ({ job }: { job: Job }) => {
  const jobStatus = job.status.status;

  const className = twMerge(
    "rounded-md w-full flex justify-between items-center p-2 gap-2",
    jobStatus === JobStatus.PENDING || jobStatus === JobStatus.ATTEMPT_FAILED
      ? "bg-inference-pending"
      : "",
    jobStatus === JobStatus.STARTED ? "bg-inference-generating" : "",
    isJobStatusError(jobStatus) ? "bg-inference-error" : "",
  );

  const getStatusText = () => {
    switch (jobStatus) {
      case JobStatus.PENDING:
        return "Pending...";
      case JobStatus.ATTEMPT_FAILED:
        return "Attempt Failed, server will retry soon!";
      case JobStatus.STARTED:
        return "Started, generating...";
      case JobStatus.DEAD:
      case JobStatus.COMPLETE_FAILURE:
      default:
        return "Error!";
    }
  };

  const handleDeleteJob = useCallback(async (job: Job) => {
    const jobsApi = new JobsApi();
    const response = await jobsApi.DeleteJobByToken(job.job_token);
    if (response.success) {
      addToast(
        ToastTypes.SUCCESS,
        "Successfully delete the audio generation job.",
      );
      PollRecentJobs();
      return;
    }
    addToast(
      ToastTypes.ERROR,
      response.errorMessage ??
        "Unknown Error in deleting audio generation job.",
    );
  }, []);

  return (
    <div className={className}>
      {isJobStatusError(jobStatus) ? (
        <FontAwesomeIcon icon={faCircleExclamation} />
      ) : (
        <FontAwesomeIcon icon={faSpinnerThird} spin />
      )}
      <H5 className="grow">{getStatusText()}</H5>
      <ButtonIcon icon={faXmark} onClick={() => handleDeleteJob(job)} />
    </div>
  );
};
