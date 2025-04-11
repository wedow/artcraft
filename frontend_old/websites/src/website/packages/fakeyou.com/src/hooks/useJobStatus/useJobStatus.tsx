import { useState } from 'react';
import { useInterval } from "hooks";
import { JobState, jobStateFromString, jobStateCanChange } from "@storyteller/components/src/jobs/JobStates";
import { GetJobStatus, GetJobStatusResponse, JobStatus }
  from "@storyteller/components/src/api/model_inference/GetJobStatus";

interface Props {
  jobToken?: string;
}

export default function useJobStatus({ jobToken }: Props) {
  const [job,jobSet] = useState<JobStatus>();
  const [stop,stopSet] = useState<boolean | undefined>();

  useInterval({
    // locked: true,
    locked: stop || !jobToken,
    interval: 1500,
    onTick: (a: any) => {
      if (jobToken) {
        GetJobStatus(jobToken,{})
        .then((res: GetJobStatusResponse) => {
          let continuePolling = jobStateCanChange(jobStateFromString(res.state.status.status));

          jobSet(res.state);
          if (!continuePolling) stopSet(true);
        });
      }
    }
  });

  return {
    ...job,
    maybe_result: job?.maybe_result || null, 
    isSuccessful: jobStateFromString(job?.status.status || "") === JobState.COMPLETE_SUCCESS
  };
};