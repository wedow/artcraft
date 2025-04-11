import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { useInferenceJobs, useLocalize } from "hooks";
import { LivePortraitDetails } from "@storyteller/components/src/api/model_inference/GetModelInferenceJobStatus";
import { GetMedia } from "@storyteller/components/src/api/media_files/GetMedia";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import moment from "moment";
import { Link } from "react-router-dom";
import LoadingSpinner from "components/common/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowTurnUp, faLips } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "components/common";
import { useHistory } from "react-router-dom";
import { isVideoToolsEnabled } from "config/featureFlags";

interface SessionLpInferenceResultsListProps {
  onJobTokens: (
    maybeResultToken: string,
    jobToken: string,
    createdAt: Date,
    maybeLivePortraitDetails?: LivePortraitDetails
  ) => void;
  addSourceToken: (token: string) => void;
  addMotionToken: (token: string) => void;
  onJobClick: (job: InferenceJob) => void;
  onJobProgress: (progress: number | null) => void;
  onJobStateChange: (jobToken: string, jobState: JobState) => void;
}

export default function SessionLpInferenceResultsList({
  onJobTokens,
  addMotionToken,
  addSourceToken,
  onJobClick,
  onJobProgress,
  onJobStateChange,
}: SessionLpInferenceResultsListProps) {
  const history = useHistory();
  const { t } = useLocalize("LivePortrait");
  const { inferenceJobsByCategory } = useInferenceJobs();
  const hasInitialized = useRef(false);

  const lastProgressRef = useRef<{ [key: string]: number | null }>({});

  const livePortraitJobs = useMemo(() => {
    return (
      inferenceJobsByCategory.get(FrontendInferenceJobType.LivePortrait) || []
    );
  }, [inferenceJobsByCategory]);

  const lastProcessedJobToken = useRef<string | null>(null);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    } else {
      livePortraitJobs.forEach((job: InferenceJob) => {
        if (
          job.maybeResultToken &&
          job.jobToken !== lastProcessedJobToken.current
        ) {
          const livePortraitDetails = job.maybeLivePortraitDetails;

          if (livePortraitDetails) {
            const { source_media_file_token, face_driver_media_file_token } =
              livePortraitDetails;

            addSourceToken(source_media_file_token);

            addMotionToken(face_driver_media_file_token);

            lastProcessedJobToken.current = job.jobToken;
            onJobTokens(
              job.maybeResultToken,
              job.jobToken,
              job.createdAt,
              livePortraitDetails
            );
          }
        }
      });
    }
  }, [livePortraitJobs, onJobTokens, addSourceToken, addMotionToken]);

  useEffect(() => {
    livePortraitJobs.forEach((job: InferenceJob) => {
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
          onJobProgress(currentProgress);
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
        onJobProgress(null);
        onJobStateChange(job.jobToken, job.jobState);
      }
    });
  }, [livePortraitJobs, onJobProgress, onJobStateChange]);

  const [mediaSrc, setMediaSrc] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchMedia = async (token: string) => {
      try {
        const response = await GetMedia(token, {});
        const publicBucketPath = response.media_file?.public_bucket_path || "";
        setMediaSrc(prev => ({ ...prev, [token]: publicBucketPath }));
      } catch (error) {
        console.error("Error fetching media:", error);
      }
    };

    livePortraitJobs.forEach((job: InferenceJob) => {
      const token = job.maybeLivePortraitDetails?.source_media_file_token;
      if (token && !mediaSrc[token]) {
        fetchMedia(token);
      }
    });
  }, [livePortraitJobs, mediaSrc]);

  const jobStateTextMap: { [key in JobState]: string } = {
    [JobState.UNKNOWN]: t("results.label.unknown"),
    [JobState.PENDING]: t("results.label.pending"),
    [JobState.STARTED]: t("results.label.started"),
    [JobState.COMPLETE_SUCCESS]: t("results.label.completeSuccess"),
    [JobState.COMPLETE_FAILURE]: t("results.label.completeFailure"),
    [JobState.ATTEMPT_FAILED]: t("results.label.attemptFailed"),
    [JobState.DEAD]: t("results.label.dead"),
    [JobState.CANCELED_BY_USER]: t("results.label.canceled"),
  };

  const handleLipsyncCTA = (
    e: React.MouseEvent<HTMLButtonElement>,
    resultToken: string | undefined
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (resultToken) {
      history.push(`/ai-lip-sync?source=${resultToken}`);
    } else {
      console.error("No result token available for this job.");
    }
  };

  const jobContent = (
    <div>
      {livePortraitJobs.length > 0 ? (
        <div className="row g-3">
          {livePortraitJobs
            .slice(0, 4)
            .map((job: InferenceJob, key: number) => (
              <div
                key={key}
                onClick={() => {
                  onJobClick(job);
                }}
                className="col-12 col-lg-3"
              >
                <div className="ls-jobs-list">
                  <div className="d-flex flex-column gap-2 w-100">
                    <div className="d-flex gap-2 align-items-center w-100">
                      <div
                        className="ratio ratio-1x1 overflow-hidden rounded"
                        style={{ width: "70px" }}
                      >
                        <img
                          src={
                            job.maybeLivePortraitDetails
                              ?.source_media_file_token
                              ? (() => {
                                  const mediaPath =
                                    mediaSrc[
                                      job.maybeLivePortraitDetails
                                        .source_media_file_token
                                    ] || "";
                                  const isVideo = mediaPath.endsWith(".mp4");
                                  const finalPath = isVideo
                                    ? `${mediaPath}-thumb.jpg`
                                    : mediaPath;
                                  return new BucketConfig().getGcsUrl(
                                    finalPath
                                  );
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
                            <LoadingSpinner
                              thin={true}
                              size={14}
                              padding={false}
                            />
                          )}
                          <span className="fw-semibold">
                            {jobStateTextMap[job.jobState as JobState]}
                          </span>
                        </div>
                        <span className="fw-normal opacity-75 fs-7">
                          {moment(job.createdAt).fromNow()}
                        </span>
                        <div className="d-flex">
                          {job.maybeResultToken ? (
                            <Link
                              className="fs-7 d-flex align-items-center gap-1 mt-1"
                              to={`/media/${job.maybeResultToken}`}
                            >
                              {t("results.link.details")}
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

                    {isVideoToolsEnabled() ? (
                      <Button
                        icon={faLips}
                        label={t("button.useWithLipsync")}
                        small={true}
                        variant={job.maybeResultToken ? "primary" : "action"}
                        disabled={!job.maybeResultToken}
                        onClick={e => {
                          if (job.maybeResultToken !== null) {
                            handleLipsyncCTA(e, job.maybeResultToken);
                          }
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div
          className="lp-jobs-list no-hover d-flex align-items-center justify-content-center"
          style={{ height: "94px" }}
        >
          <span className="fw-medium opacity-75">
            {t("label.latestOutputsEmptyText")}
          </span>
        </div>
      )}
    </div>
  );

  return <>{jobContent}</>;
}
