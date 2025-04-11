import { useContext, useEffect, useState } from "react";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { InferenceJobsContext } from "components/providers";
import { useModal } from "hooks";
import { InferenceJobsModal } from "components/modals";

// interface UseInferenceJobsProps {
//   autoStart?: boolean;
//   debug?: string;
// }

export default function useInferenceJobs(debug = "") {
  const {
    byCategory,
    clearJobs,
    clearJobsStatus,
    enqueue,
    inferenceJobs,
    queueStats,
    someJobsAreDone,
    startJobs,
  } = useContext(InferenceJobsContext);

  const { open } = useModal();
  const [loaded, loadedSet] = useState(false);

  const openJobListModal = (jobType?: FrontendInferenceJobType) =>
    open({ component: InferenceJobsModal, props: { jobType } });

  if (debug) {
    console.log(`debug location: ${debug}`);
  }

  useEffect(() => {
    if (!loaded && startJobs) {
      loadedSet(true);
      startJobs();
    }
  }, [loaded, startJobs]);

  return {
    clearJobs,
    clearJobsStatus,
    enqueue: (
      jobToken: string,
      jobTypeOverride?: FrontendInferenceJobType,
      openModal = false
    ) => {
      if (openModal) {
        openJobListModal();
      }
      enqueue(jobToken, jobTypeOverride);
    },
    enqueueInferenceJob: enqueue,
    inferenceJobs,
    inferenceJobsByCategory: byCategory,
    jobStatusDescription: (jobState: JobState) =>
      Object.keys(JobState).filter(key => isNaN(Number(key)))[jobState],
    queueStats,
    someJobsAreDone,
  };
}
