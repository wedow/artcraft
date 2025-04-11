import { useEffect, useState } from "react";
import {
  JobsBySession,
  JobsBySessionResponse,
} from "@storyteller/components/src/api/jobs/JobsBySession";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { jobStateCanChange } from "@storyteller/components/src/jobs/JobStates";
import { SessionWrapper } from "@storyteller/components/src/session/SessionWrapper";
import {
  GetJobStatus,
  GetJobStatusResponse,
} from "@storyteller/components/src/api/model_inference/GetJobStatus";
import {
  DismissFinishedJobs,
  DismissFinishedJobsResponse,
} from "@storyteller/components/src/api/jobs/DismissFinishedJobs";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { useInterval } from "hooks";

export type CategoryMap = Map<FrontendInferenceJobType, InferenceJob[]>;

const JobCategoryToType = (jobCategory: string) => {
  switch (jobCategory) {
    case "lipsync_animation":
      return FrontendInferenceJobType.FaceAnimation;
    case "text_to_speech":
      return FrontendInferenceJobType.TextToSpeech;
    case "voice_conversion":
      return FrontendInferenceJobType.VoiceConversion;
    case "image_generation":
      return FrontendInferenceJobType.ImageGeneration;
    case "mocap":
      return FrontendInferenceJobType.VideoMotionCapture;
    case "workflow":
      return FrontendInferenceJobType.VideoWorkflow;
    case "format_conversion":
      return FrontendInferenceJobType.ConvertFbxtoGltf;
    case "convert_bvh_to_workflow":
      return FrontendInferenceJobType.EngineComposition;
    case "live_portrait":
      return FrontendInferenceJobType.LivePortrait;
    case "f5_tts":
      return FrontendInferenceJobType.F5Tts;
    case "seed_vc":
      return FrontendInferenceJobType.SeedVc;
    default:
      return FrontendInferenceJobType.Unknown;
  }
};

export interface JobsPollingProps {
  debug?: boolean;
  sessionWrapper: SessionWrapper;
}

const newJobCategoryMap = (): CategoryMap => {
  let inferenceJobsByCategory = new Map();
  Object.keys(FrontendInferenceJobType)
    .filter(key => !isNaN(Number(key))) // remove string keys
    .forEach(key => inferenceJobsByCategory.set(Number(key), []));

  return inferenceJobsByCategory;
};

export default function useInferenceJobsPolling({
  debug,
  sessionWrapper,
}: JobsPollingProps) {
  const { user } = sessionWrapper?.sessionStateResponse || { user: null };

  const [inferenceJobs, inferenceJobsSet] = useState<InferenceJob[]>();
  const [byCategory, byCategorySet] = useState(newJobCategoryMap());
  const [initialized, initializedSet] = useState(false);

  const [clearJobsStatus, clearJobsStatusSet] = useState(FetchStatus.ready);

  // this boolean when set to true starts a useInterval loop, when false it runs clearInterval on that loop
  // this is to prevent memory leaks, and to update params provided to useInterval's onTick event.
  const [keepAlive, keepAliveSet] = useState(!!user);

  // if this interval value is state set by the server response, useInterval will adjust accordingly
  const interval = 1500;

  // this is to acccomodate async session loading
  useEffect(() => {
    if (user && !keepAlive) {
      // initializedSet(true);
      keepAliveSet(true);
    }
  }, [keepAlive, user]);

  if (debug)
    console.log("💀 keepAlive", { keepAlive, inferenceJobs, byCategory });

  const updateCategoryMap = (
    categoryMap: CategoryMap,
    updatedJob: InferenceJob,
    frontendJobType: FrontendInferenceJobType
  ) => {
    const categoryArray = categoryMap.get(frontendJobType) || [];

    if (user) {
      categoryMap.set(frontendJobType, [...categoryArray, updatedJob]);
    } else {
      const inArray = categoryArray.find(
        (job, i) => job.jobToken === updatedJob.jobToken
      );

      if (!inArray) {
        categoryMap.set(frontendJobType, [updatedJob, ...categoryArray]);
      } else {
        categoryMap.set(
          frontendJobType,
          categoryArray.map((job, i) =>
            job.jobToken === updatedJob.jobToken ? updatedJob : job
          )
        );
      }
    }
  };

  const updateState = (
    updatedJobs: InferenceJob[],
    categoryMap: CategoryMap
  ) => {
    inferenceJobsSet(updatedJobs);
    byCategorySet(categoryMap);
    if (
      (user || updatedJobs.length) &&
      !updatedJobs.some(job => jobStateCanChange(job.jobState))
    ) {
      keepAliveSet(false);
    }
  };

  const sessionJobs = () =>
    JobsBySession("", {}).then((res: JobsBySessionResponse) => {
      if (res && res.jobs) {
        let categoryMap = new Map(newJobCategoryMap());
        const updatedJobs = res.jobs.map((job, i) => {
          const frontendJobType = JobCategoryToType(
            job.request.inference_category
          );

          const updatedJob = InferenceJob.fromResponse(job, frontendJobType);

          updateCategoryMap(categoryMap, updatedJob, frontendJobType);

          return updatedJob;
        });

        updateState(updatedJobs, categoryMap);
      }
    });

  const noSessionJobs = async (
    currentQueue: InferenceJob[],
    currentCategoryMap: CategoryMap
  ) => {
    let categoryMap = new Map(currentCategoryMap);
    Promise.all(
      currentQueue.map(async (job: InferenceJob) => {
        return await GetJobStatus(job.jobToken, {}).then(
          (res: GetJobStatusResponse) => {
            const updatedJob = InferenceJob.fromResponse(
              res.state!,
              job.frontendJobType
            );
            updateCategoryMap(categoryMap, updatedJob, job.frontendJobType);
            return updatedJob;
          }
        );
      })
    ).then(updatedJobs => {
      if (updatedJobs.length) {
        updateState(updatedJobs, categoryMap);
      }
    });
  };

  const onTick = async ({
    eventProps: { inferenceJobs: currentQueue, byCategory: currentCategoryMap },
  }: {
    eventProps: { inferenceJobs: InferenceJob[]; byCategory: CategoryMap };
  }) => {
    if (user) {
      sessionJobs();
    } else if (inferenceJobs && inferenceJobs.length) {
      noSessionJobs(currentQueue, currentCategoryMap);
    }
  };

  const enqueueInferenceJob = (
    jobToken: string,
    frontendJobType: FrontendInferenceJobType,
    createdAt: Date
  ) => {
    onTick({ eventProps: { byCategory, inferenceJobs: [] } });
    if (user) {
      // reserving this space for later uses
    } else {
      keepAliveSet(false);
      const newJob = new InferenceJob(jobToken, createdAt, frontendJobType);
      inferenceJobsSet([newJob, ...(inferenceJobs || [])]);
    }

    keepAliveSet(true);
  };

  const clearJobs = () => {
    keepAliveSet(false);
    if (clearJobsStatus === FetchStatus.ready) {
      clearJobsStatusSet(FetchStatus.in_progress);
      DismissFinishedJobs("", {}).then((res: DismissFinishedJobsResponse) => {
        if (res.success) {
          onTick({
            eventProps: { byCategory: newJobCategoryMap(), inferenceJobs: [] },
          });
          keepAliveSet(true);
          clearJobsStatusSet(FetchStatus.ready);
        }
      });
    }
  };

  const someJobsAreDone =
    !!inferenceJobs &&
    inferenceJobs.some(job => !jobStateCanChange(job.jobState));

  const startJobs = () => {
    if (!initialized) {
      setTimeout(() => initializedSet(true), 250);
    }
  };

  useInterval({
    eventProps: { byCategory, inferenceJobs },
    interval,
    onTick,
    locked: !initialized || !keepAlive,
  });

  return {
    byCategory,
    clearJobs,
    clearJobsStatus,
    inferenceJobsByCategory: byCategory,
    enqueueInferenceJob,
    inferenceJobs,
    someJobsAreDone,
    startJobs,
  };
}
