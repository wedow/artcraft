import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faHeadphonesSimple } from "@fortawesome/free-solid-svg-icons";

import { Analytics } from "../../../common/Analytics";
import { SessionTtsAudioPlayer } from "./SessionTtsAudioPlayer";
import { WebUrl } from "../../../common/WebUrl";
import {
  GetPendingTtsJobCount,
  GetPendingTtsJobCountIsOk,
  GetPendingTtsJobCountSuccessResponse,
} from "@storyteller/components/src/api/tts/GetPendingTtsJobCount";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { useInferenceJobs, useLocalize, useSession } from "hooks";
import { Button, WeightCoverImage } from "components/common";
import {
  faArrowDownToLine,
  faArrowRight,
  faLips,
  faStars,
} from "@fortawesome/pro-solid-svg-icons";
import LoadingSpinner from "components/common/LoadingSpinner";
import { GetWeight } from "@storyteller/components/src/api/weights/GetWeight";
// import Tippy from "@tippyjs/react";
import { isMobile } from "react-device-detect";
import { LipsyncTokenMap } from "../pages/lipsync/LipsyncTokens";
import { isVideoToolsEnabled } from "config/featureFlags";

interface Props {
  mode?: "tts" | "lipsync";
  onResultClick?: (
    maybeModelToken: string | undefined,
    maybeResultToken: string | undefined | null
  ) => void;
}

// TODO: This is duplicated in SessionTtsInferenceResultsList !
// Default to querying every 15 seconds, but make it configurable serverside
const DEFAULT_QUEUE_REFRESH_INTERVAL_MILLIS = 15000;

function SessionTtsInferenceResultList(props: Props) {
  const { inferenceJobsByCategory } = useInferenceJobs();
  const { t } = useLocalize("SessionTtsInferenceResultList");
  const { t: t2 } = useLocalize("NewTTS");
  const { loggedIn, loggedInOrModal, sessionSubscriptions } = useSession();
  const [pendingTtsJobs, setPendingTtsJobs] =
    useState<GetPendingTtsJobCountSuccessResponse>({
      success: true,
      pending_job_count: 0,
      cache_time: new Date(0), // NB: Epoch is used for vector clock's initial state
      refresh_interval_millis: DEFAULT_QUEUE_REFRESH_INTERVAL_MILLIS,
    });

  const [mediaSrc, setMediaSrc] = useState<{ [key: string]: string }>({});
  // const history = useHistory();

  const fetchMedia = async (token: string) => {
    try {
      const response = await GetWeight(token, {});
      const publicBucketPath =
        response.cover_image.maybe_cover_image_public_bucket_path || "";
      setMediaSrc(prev => ({ ...prev, [token]: publicBucketPath }));
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      const response = await GetPendingTtsJobCount();
      if (GetPendingTtsJobCountIsOk(response)) {
        if (
          response.cache_time.getTime() > pendingTtsJobs.cache_time.getTime()
        ) {
          setPendingTtsJobs(response);
        }
      }
    };
    // TODO: We're having an outage and need to lower this.
    //const interval = setInterval(async () => fetch(), 15000);
    const refreshInterval = Math.max(
      DEFAULT_QUEUE_REFRESH_INTERVAL_MILLIS,
      pendingTtsJobs.refresh_interval_millis
    );
    const interval = setInterval(async () => fetch(), refreshInterval);
    fetch();
    return () => clearInterval(interval);
  }, [pendingTtsJobs]);

  useEffect(() => {
    inferenceJobsByCategory
      .get(FrontendInferenceJobType.TextToSpeech)
      ?.forEach((job: InferenceJob) => {
        if (job.maybeModelToken) {
          fetchMedia(job.maybeModelToken);
        }
      });
  }, [inferenceJobsByCategory]);

  // const handleLipSyncClick = () => {
  //   history.push("/beta/lip-sync");
  // };

  let results: Array<JSX.Element> = [];

  // TODO(bt,2023-04-08): Clean this utter garbage duplication up.

  // ============================= GENERIC INFERENCE =============================

  inferenceJobsByCategory
    .get(FrontendInferenceJobType.TextToSpeech)
    .forEach((job: InferenceJob) => {
      if (!job.maybeResultToken) {
        let cssStyle = "alert alert-secondary mb-0";
        let stateDescription = "Pending...";
        let loadingSpinner = null;
        let percentage = job.progressPercentage;

        switch (job.jobState) {
          case JobState.PENDING:
          case JobState.UNKNOWN:
            stateDescription =
              job.maybeExtraStatusDescription == null
                ? t("resultsProgressPending")
                : job.maybeExtraStatusDescription;
            loadingSpinner = (
              <LoadingSpinner
                className="fs-6"
                padding={false}
                thin={true}
                size={16}
              />
            );
            break;
          case JobState.STARTED:
            cssStyle = "alert alert-success mb-0";
            stateDescription =
              job.maybeExtraStatusDescription == null
                ? t("resultsProgressStarted")
                : job.maybeExtraStatusDescription;
            loadingSpinner = (
              <LoadingSpinner
                className="fs-6"
                padding={false}
                thin={true}
                size={16}
              />
            );
            break;
          case JobState.ATTEMPT_FAILED:
            cssStyle = "alert alert-danger mb-0";
            stateDescription = `${t("resultsProgressFail", {
              0: job.attemptCount || "0",
            })}}`;
            loadingSpinner = (
              <LoadingSpinner
                className="fs-6"
                padding={false}
                thin={true}
                size={16}
              />
            );
            break;
          case JobState.COMPLETE_FAILURE:
          case JobState.DEAD:
            cssStyle = "alert alert-danger mb-0";
            // TODO(bt,2023-01-23): Translate when I can test it
            stateDescription = t("resultsProgressDead");
            break;
          case JobState.COMPLETE_SUCCESS:
            cssStyle = "message is-success mb-0";
            // Not sure why we're here instead of other branch!
            stateDescription = t("resultsProgressSuccess");
            break;
        }

        results.push(
          <div key={job.jobToken}>
            <div className={`d-flex gap-2 ${cssStyle} fw-medium`.trim()}>
              {loadingSpinner}
              {stateDescription}
              {percentage !== 0 && ` (${percentage}%)`}
            </div>
          </div>
        );
      } else {
        let audioLink = new BucketConfig().getGcsUrl(
          job.maybeResultPublicBucketMediaPath
        );

        // NB(bt,2023-12-07): We're migrating TTS results from the "tts_results" table (token
        // prefix "TR:") to the "media_files" table (token prefix "m_")
        let ttsPermalink;
        if ((job.maybeResultToken || "").startsWith("m_")) {
          ttsPermalink = `/media/${job.maybeResultToken}`;
        } else {
          ttsPermalink = `/tts/result/${job.maybeResultToken}`;
        }

        let wavesurfers = <SessionTtsAudioPlayer filename={audioLink} />;

        results.push(
          <div
            key={job.jobToken}
            onClick={() =>
              props.onResultClick?.(job.maybeModelToken, job.maybeResultToken)
            }
          >
            <div
              className={`panel panel-results p-3 gap-3 d-flex flex-column ${
                props.mode === "lipsync" ? "lipsync-tts-results" : ""
              }`.trim()}
            >
              <div>
                <div className="d-flex gap-1 mb-2">
                  {job.maybeModelToken ? (
                    // <Tippy
                    //   content={
                    //     <span className="fs-7">Use audio with Lip Sync</span>
                    //   }
                    //   theme="fakeyou"
                    // >
                    <div>
                      <WeightCoverImage
                        src={
                          mediaSrc[job.maybeModelToken]
                            ? new BucketConfig().getGcsUrl(
                                mediaSrc[job.maybeModelToken]
                              )
                            : ""
                        }
                        height={36}
                        width={36}
                        marginRight={7}
                      />
                    </div>
                  ) : (
                    // </Tippy>
                    <LoadingSpinner />
                  )}

                  <div className="d-flex flex-column justify-content-center flex-grow-1">
                    <h6 className="mb-0 fw-semibold">{job.maybeModelTitle}</h6>
                  </div>

                  {props.mode === "lipsync" ? (
                    <div>
                      <div className="fs-7 fw-medium fy-select-voice">Use</div>
                    </div>
                  ) : (
                    <div>
                      <Button
                        iconFlip={true}
                        variant="link"
                        label="More details"
                        className="fs-7"
                        icon={isMobile ? undefined : faArrowRight}
                        to={ttsPermalink}
                      />
                    </div>
                  )}
                </div>

                <p className="fs-7 pt-1">{job.maybeRawInferenceText}</p>
              </div>
              {props.mode === "lipsync" ? null : (
                <>
                  <div className="d-flex gap-3 align-items-center">
                    {wavesurfers}
                    <Button
                      variant="action"
                      small={true}
                      square={true}
                      icon={faArrowDownToLine}
                      fontLarge={true}
                      to={ttsPermalink}
                      onClick={() => {
                        Analytics.ttsClickResultLink();
                      }}
                    />
                  </div>

                  {isVideoToolsEnabled() &&
                  job.maybeModelToken &&
                  LipsyncTokenMap[job.maybeModelToken] ? (
                    <div className="d-flex mt-2">
                      <Button
                        variant="rainbow"
                        label={t2("sessionResults.lipsync")}
                        className="fs-7"
                        icon={faLips}
                        to={`/ai-lip-sync?voice=${job.maybeModelToken}&audio=${job.maybeResultToken}`}
                        small={true}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        );
      }
    });

  if (props.mode === "lipsync") {
    results = results.slice(0, 5);
  }

  let noResultsSection = (
    <div className="panel panel-inner text-center p-5 rounded-5 h-100">
      <div className="d-flex flex-column opacity-75 h-100 justify-content-center">
        <FontAwesomeIcon icon={faHeadphonesSimple} className="fs-3 mb-3" />
        <h5 className="fw-semibold">{t2("sessionResults.emptyTitle")}</h5>
        <p>{t2("sessionResults.emptySubtitle")}</p>
      </div>
    </div>
  );

  if (results.length === 0) {
    return <>{noResultsSection}</>;
  }

  let upgradeNotice = <></>;

  // Ask non-premium users to upgrade
  if (results.length !== 0 && !sessionSubscriptions?.hasPaidFeatures()) {
    if (loggedIn) {
      upgradeNotice = (
        <div className="d-flex flex-column gap-3 sticky-top zi-2">
          <div className="alert alert-primary alert-cta mb-0">
            <FontAwesomeIcon icon={faStars} className="me-2" />
            {t2("sessionResults.alertNoPlan")}{" "}
            <Link
              to={WebUrl.pricingPageWithReferer("nowait")}
              onClick={() => {
                Analytics.ttsTooSlowUpgradePremium();
              }}
              className="alert-link fw-semibold"
            >
              {t2("sessionResults.alertNoPlanLink")}
            </Link>
          </div>
        </div>
      );
    } else {
      upgradeNotice = (
        <div className="d-flex flex-column gap-3 sticky-top zi-2">
          <div className="alert alert-warning alert-cta mb-0 d-flex align-items-center">
            <FontAwesomeIcon icon={faClock} className="me-2" />
            {t2("sessionResults.alertNonUser")}{" "}
            <Button
              onClick={() =>
                !loggedInOrModal({
                  loginMessage: t2("modal.title.login"),
                  signupMessage: t2("modal.title.signUp"),
                })
              }
              variant="link"
              className="alert-link fw-semibold ms-1"
              label={t2("sessionResults.alertNonUserLink")}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="d-flex flex-column gap-3">
      {upgradeNotice}
      <div className="d-flex flex-column gap-3">{results}</div>
    </div>
  );
}

export { SessionTtsInferenceResultList };
