import React, { useEffect, useState } from "react";
import { a, useSpring } from "@react-spring/web";
import { ArrowX, WorkIndicator } from "components/svg";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import {
  MediaFile,
  MediaLinkUtility,
} from "@storyteller/components/src/api/media_files";
import {
  CancelJob,
  CancelJobResponse,
} from "@storyteller/components/src/api/jobs/CancelJob";
import { useHover, useMedia, useSlides } from "hooks";
import {
  JobState,
  jobStateCanChange,
} from "@storyteller/components/src/jobs/JobStates";
import { Button } from "components/common";
import { useHistory } from "react-router-dom";
import { STYLES_BY_KEY } from "common/StyleOptions";
import JobResultPreview from "./JobResultPreview";
import { faArrowDownToLine } from "@fortawesome/pro-solid-svg-icons";

interface JobListItem extends InferenceJob {
  failures: (fail: string) => string;
  jobStatusDescription?: any;
  onSelect?: any;
  progressPercentage: number;
  resultPaths: { [key: string]: string };
  t?: any;
}

const BaseAction = ({
  canStop = false,
  hover = false,
  links,
  mediaFile,
  maybeResultToken = "",
  success = false,
  toggleSlide = () => {},
}: {
  canStop: boolean;
  hover: boolean;
  links: MediaLinkUtility;
  mediaFile: MediaFile;
  maybeResultToken: string;
  success: boolean;
  toggleSlide: () => void;
}) =>
  canStop || success ? (
    <>
      <JobResultPreview
        {...{
          hover,
          links,
          mediaFile,
          mediaToken: maybeResultToken,
          show: success,
        }}
      />
      {success && (
        <Button
          {...{
            href: links.mainURL,
            icon: faArrowDownToLine,
            onClick: (e: any) => {
              e.stopPropagation();
            },
            square: true,
            small: true,
            target: "_blank",
            variant: "secondary",
          }}
        />
      )}
      <svg
        {...{
          className: `fy-inference-job-action${success ? "-success" : ""}`,
          ...(success ? {} : { onClick: toggleSlide }),
        }}
      >
        <ArrowX {...{ checked: success }} />
      </svg>
    </>
  ) : (
    <></>
  );

const StopConfirm = ({ stopClick = () => {}, toggleSlide = () => {} }) => (
  <>
    Stop job?
    <div {...{ className: "job-stop-confirm", onClick: stopClick }}>Yes</div>
    <div {...{ className: "job-stop-cancel", onClick: toggleSlide }}>No</div>
  </>
);

export default function JobItem({
  failures,
  frontendJobType,
  maybeFailureCategory,
  maybeModelTitle,
  maybeStyleName,
  maybeResultToken,
  onSelect,
  progressPercentage,
  jobToken,
  jobState,
  jobStatusDescription,
  resultPaths,
  t = (key: string) => key,
  ...rest
}: JobListItem) {
  const history = useHistory();
  const [hover, hoverSet = {}] = useHover({});
  const [hasBounced, hasBouncedSet] = useState(false);
  const [bounce, bounceSet] = useState(false);
  const [index, indexSet] = useState(0);
  const jobType = FrontendInferenceJobType[frontendJobType];
  const jobStatus = jobStatusDescription(jobState);

  // const jobStatusClass = jobStatus.toLowerCase().replace("_", "-");
  const resultPath = resultPaths[jobType];
  const success = jobState === JobState.COMPLETE_SUCCESS;
  const failure =
    jobState === JobState.COMPLETE_FAILURE ||
    jobState === JobState.DEAD ||
    jobState === JobState.CANCELED_BY_USER;

  // const [jobState,jobStateSet] = useState(0); // for animation debugging
  // useInterval({ interval: 3000, onTick: ({ index }: { index: number }) => { jobStateSet(index); if (!index) hasBouncedSet(false) } });

  const dashStatus = () => {
    switch (jobState) {
      case JobState.COMPLETE_SUCCESS:
      case JobState.COMPLETE_FAILURE:
      case JobState.DEAD:
      case JobState.CANCELED_BY_USER:
        return 2;
      case JobState.STARTED:
      case JobState.ATTEMPT_FAILED:
        return 1;
      case JobState.PENDING:
      case JobState.UNKNOWN:
      default:
        return 0;
    }
  };

  const canStop = () => {
    switch (jobState) {
      case JobState.ATTEMPT_FAILED:
      case JobState.PENDING:
      case JobState.UNKNOWN:
        return true;
      default:
        return false;
    }
  };

  const showModel = () => {
    switch (frontendJobType) {
      case FrontendInferenceJobType.VoiceConversion:
      case FrontendInferenceJobType.VoiceDesignerTts:
      case FrontendInferenceJobType.ImageGeneration:
      case FrontendInferenceJobType.TextToSpeech:
        return true;
      default:
        return false;
    }
  };

  const jobIsAlive = jobStateCanChange(jobState);

  const makeBounce = (amount = 0, delay = 0) => ({
    delay,
    config: { tension: 250, friction: 12 },
    transform: `translate(${bounce ? amount : 0}px)`,
  });
  const headingBounce = useSpring(makeBounce(8));
  const subtitleBounce = useSpring(makeBounce(6, 30));

  const subtitle = maybeFailureCategory
    ? `${failures(maybeFailureCategory)}`
    : t(`subtitles.${jobStatus}`);

  const toggleSlide = (e: any) => {
    e.stopPropagation();
    indexSet(index ? 0 : 1);
  };
  const outerProps = (c: string) => ({
    className: `${c} fy-inference-job-hover-${hover ? "on" : "off"}${
      success ? " fy-inference-job-success" : ""
    }`,
    onClick: () => {
      if (success) {
        history.push(`${resultPath}/${maybeResultToken}`);
        onSelect();
      }
    },
  });

  const stopClick = (e: any) => {
    if (canStop()) {
      toggleSlide(e);
      CancelJob(jobToken, {}).then((res: CancelJobResponse) => {});
    }
  };

  const { links, mediaFile } = useMedia({ mediaToken: maybeResultToken || "" });

  const slides = useSlides({
    index,
    slides: [
      {
        component: BaseAction,
        props: {
          canStop: canStop(),
          hover,
          links,
          maybeResultToken,
          mediaFile,
          success,
          toggleSlide,
        },
      },
      { component: StopConfirm, props: { stopClick, toggleSlide } },
    ],
  });

  useEffect(() => {
    if (!bounce && !hasBounced && success) {
      hasBouncedSet(true);
      bounceSet(true);
      setTimeout(() => bounceSet(false), 250);
    }
  }, [bounce, hasBounced, success]);

  return (
    <>
      <div {...{ ...outerProps("fy-inference-job-indicator"), ...hoverSet }}>
        <WorkIndicator
          {...{
            failure,
            progressPercentage,
            stage: dashStatus(),
            showPercentage: jobIsAlive,
            success,
          }}
        />
      </div>
      <div {...{ ...outerProps("fy-inference-job-details"), ...hoverSet }}>
        <a.h6 {...{ style: headingBounce }}>
          {t(`${jobType}.${jobStatus}`)}
        </a.h6>
        <div className="d-flex align-items-center gap-2">
          <a.span
            {...{
              style: subtitleBounce,
              className: `fy-inference-job-subtitle${
                success ? "-success" : ""
              }`,
            }}
          >
            {subtitle}
          </a.span>
          {maybeStyleName && (
            <span className="opacity-75 fs-7">
              ({STYLES_BY_KEY.get(maybeStyleName)?.label || maybeStyleName})
            </span>
          )}
        </div>
      </div>
      <div {...{ ...outerProps("fy-inference-job-info"), ...hoverSet }}>
        {showModel() && (
          <>
            <div {...{ className: "job-info-label" }}>Model</div>
            <div {...{ className: "job-info-value" }}>{maybeModelTitle}</div>
          </>
        )}
      </div>
      <div {...{ ...outerProps(`fy-inference-job-action-frame`), ...hoverSet }}>
        {slides}
      </div>
    </>
  );
}
