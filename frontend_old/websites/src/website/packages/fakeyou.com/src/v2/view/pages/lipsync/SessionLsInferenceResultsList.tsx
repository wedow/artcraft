import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { useInferenceJobs } from "hooks";
import { GetMedia } from "@storyteller/components/src/api/media_files/GetMedia";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import moment from "moment";
import { Link } from "react-router-dom";
import LoadingSpinner from "components/common/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowTurnUp } from "@fortawesome/pro-solid-svg-icons";

interface SessionLpInferenceResultsListProps {
  onJobTokens: (
    maybeResultToken: string,
    jobToken: string,
    createdAt: Date
  ) => void;
  onJobClick?: (job: InferenceJob) => void;
  onJobProgress?: (progressPercentage: number | null) => void;
}

export default function SessionLpInferenceResultsList({
  onJobTokens,
  onJobClick,
  onJobProgress,
}: SessionLpInferenceResultsListProps) {
  const { inferenceJobsByCategory } = useInferenceJobs();
  const hasInitialized = useRef(false);

  const lastProgressRef = useRef<{ [key: string]: number | null }>({});

  const lipsyncJobs = useMemo(() => {
    return (
      inferenceJobsByCategory.get(FrontendInferenceJobType.FaceAnimation) || []
    );
  }, [inferenceJobsByCategory]);

  const lastProcessedJobToken = useRef<string | null>(null);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    } else {
      lipsyncJobs.forEach((job: InferenceJob) => {
        if (
          job.maybeResultToken &&
          job.jobToken !== lastProcessedJobToken.current
        ) {
          lastProcessedJobToken.current = job.jobToken;
          onJobTokens(job.maybeResultToken, job.jobToken, job.createdAt);
        }
      });
    }
  }, [lipsyncJobs, onJobTokens]);

  useEffect(() => {
    lipsyncJobs.forEach((job: InferenceJob) => {
      const currentProgress = job.progressPercentage;

      // Early return if nothing has changed
      if (
        (job.jobState === JobState.STARTED && currentProgress === null) ||
        (job.jobState !== JobState.STARTED &&
          job.jobState !== JobState.COMPLETE_SUCCESS &&
          job.jobState !== JobState.COMPLETE_FAILURE)
      ) {
        return;
      }

      // Progress handling for STARTED jobs
      if (job.jobState === JobState.STARTED) {
        if (lastProgressRef.current[job.jobToken] !== currentProgress) {
          lastProgressRef.current[job.jobToken] = currentProgress;
          if (onJobProgress) {
            onJobProgress(currentProgress);
          }
        }
        return;
      }

      // Handling COMPLETE_SUCCESS or COMPLETE_FAILURE states
      if (
        (job.jobState === JobState.COMPLETE_SUCCESS ||
          job.jobState === JobState.COMPLETE_FAILURE) &&
        lastProgressRef.current[job.jobToken] !== null
      ) {
        lastProgressRef.current[job.jobToken] = null;
      }
    });
  }, [lipsyncJobs, onJobProgress]);

  const [mediaSrc, setMediaSrc] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchMedia = async (token: string) => {
      try {
        const response = await GetMedia(token, {});
        const publicBucketPath =
          response.media_file?.media_links?.cdn_url || "";
        setMediaSrc(prev => ({ ...prev, [token]: publicBucketPath }));
      } catch (error) {
        console.error("Error fetching media:", error);
      }
    };

    lipsyncJobs.forEach((job: InferenceJob) => {
      const token = job.maybeLipsyncDetails?.image_or_video_source_token;
      if (token && !mediaSrc[token]) {
        fetchMedia(token);
      }
    });
  }, [lipsyncJobs, mediaSrc]);

  const jobStateTextMap: { [key in JobState]: string } = {
    [JobState.UNKNOWN]: "Unknown",
    [JobState.PENDING]: "Pending",
    [JobState.STARTED]: "Generating",
    [JobState.COMPLETE_SUCCESS]: "Completed",
    [JobState.COMPLETE_FAILURE]: "Completed (Failure)",
    [JobState.ATTEMPT_FAILED]: "Attempt Failed",
    [JobState.DEAD]: "Dead",
    [JobState.CANCELED_BY_USER]: "Canceled by User",
  };

  const jobContent = (
    <div
      style={{
        maxHeight: "260px",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {lipsyncJobs.length > 0 ? (
        <div className="row g-3">
          {lipsyncJobs.slice(0, 6).map((job: InferenceJob, key: number) => (
            <div
              key={key}
              onClick={() => {
                onJobClick && onJobClick(job);
              }}
            >
              <div className="lp-jobs-list">
                <div
                  className="ratio ratio-1x1 overflow-hidden rounded"
                  style={{ width: "44px" }}
                >
                  <img
                    src={
                      job.maybeLipsyncDetails?.image_or_video_source_token
                        ? (() => {
                            const mediaPath =
                              mediaSrc[
                                job.maybeLipsyncDetails
                                  .image_or_video_source_token
                              ] || "";
                            const isVideo = mediaPath.endsWith(".mp4");
                            const finalPath = isVideo
                              ? `${mediaPath}-thumb.jpg`
                              : mediaPath;
                            return finalPath;
                          })()
                        : ""
                    }
                    alt="Job Thumbnail"
                    className="object-fit-cover w-100 h-100 rounded"
                  />
                </div>
                <div className="d-flex flex-column flex-grow-1">
                  <div className="d-flex gap-2 align-items-center">
                    {(job.jobState === JobState.PENDING ||
                      job.jobState === JobState.STARTED) && (
                      <LoadingSpinner thin={true} size={14} padding={false} />
                    )}
                    <span className="fw-semibold">
                      {jobStateTextMap[job.jobState as JobState]}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-normal opacity-75 fs-7">
                      {moment(job.createdAt).fromNow()}
                    </span>
                    <span className="opacity-50">•</span>
                    {job.maybeResultToken ? (
                      <Link
                        className="fs-7 d-flex align-items-center gap-1 mt-1"
                        to={`/media/${job.maybeResultToken}`}
                      >
                        More Details
                      </Link>
                    ) : (
                      <div className="fs-7 opacity-50 fw-medium mt-1">
                        {job.progressPercentage}% complete
                      </div>
                    )}
                  </div>
                </div>
                <FontAwesomeIcon
                  icon={faArrowTurnUp}
                  className="pe-2 fs-5 opacity-75"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="lp-jobs-list no-hover d-flex align-items-center justify-content-center"
          style={{ minHeight: "73px" }}
        >
          <span className="fw-medium opacity-75">
            Your latest lip sync generations will appear here.
          </span>
        </div>
      )}
    </div>
  );

  return <>{jobContent}</>;
}
