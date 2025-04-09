import React from "react";
import {
  AllInferenceJobs,
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import JobItem from "./JobItem";
import { useInferenceJobs, useLocalize, useSession } from "hooks";
import "./InferenceJobsList.scss";
import {
  JobsClearButton,
  Button,
  Panel,
  JobQueueTicker,
} from "components/common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList } from "@fortawesome/pro-solid-svg-icons";

interface JobsListProps {
  debug?: string;
  failures: (fail: string) => string;
  jobType?: FrontendInferenceJobType | AllInferenceJobs;
  onSelect?: (e: any) => any;
  panel?: boolean;
  scroll?: boolean;
  showJobQueue?: boolean;
  showNoJobs?: boolean;
  showHeader?: boolean;
}

const resultPaths = {
  EngineComposition: "/media",
  FaceAnimation: "/media",
  TextToSpeech: "/media",
  VideoStyleTransfer: "/media",
  VoiceConversion: "/media",
  VoiceDesignerCreateVoice: "/voice-designer/voice",
  VoiceDesignerTts: "/media",
  VideoWorkflow: "/media",
  ImageGeneration: "/media",
  LivePortrait: "/media",
  Unknown: "/media",
};

export default function InferenceJobsList({
  debug,
  failures,
  jobType,
  onSelect,
  panel = true,
  scroll = false,
  showHeader = true,
  showJobQueue = false,
  showNoJobs = false,
}: JobsListProps) {
  const { sessionSubscriptions } = useSession();
  const hasPaidFeatures = sessionSubscriptions?.hasPaidFeatures();
  const {
    clearJobs,
    clearJobsStatus,
    inferenceJobs = [],
    inferenceJobsByCategory,
    jobStatusDescription,
    someJobsAreDone,
  } = useInferenceJobs(debug);
  const { t } = useLocalize("InferenceJobs");

  const selectedJobs =
    jobType === undefined || jobType === AllInferenceJobs.All
      ? inferenceJobs
      : inferenceJobsByCategory.get(jobType);

  // const { index, ticker } = useInterval({
  //   debug: "YES",
  //   end: 2,
  //   interval: 1000,
  // });

  const jobContent = (
    <div
      {...{
        className: `fy-inference-jobs-content${
          scroll ? " fy-inference-jobs-scroll-list" : ""
        }`,
      }}
    >
      {showHeader && (
        <header>
          <h3 className="fw-semibold">{t("core.heading")}</h3>
          <div
            {...{
              className: "fy-clear-jobs-input",
            }}
          >
            <JobsClearButton
              {...{
                clearJobs,
                clearJobsStatus,
                someJobsAreDone,
              }}
            />
          </div>
        </header>
      )}
      {showJobQueue && <JobQueueTicker {...{ hasPaidFeatures }} />}
      <div {...{ className: "fy-inference-jobs-list-grid" }}>
        {selectedJobs &&
          selectedJobs.map((job: InferenceJob, key: number) => (
            <JobItem
              {...{
                failures,
                jobStatusDescription,
                key,
                onSelect,
                resultPaths,
                t,
                ...job,
              }}
            />
          ))}
      </div>
      {(!selectedJobs || !selectedJobs.length) && showNoJobs && (
        <div
          className="d-flex flex-column p-4 gap-3 text-center align-items-center justify-content-center"
          style={{ minHeight: "38vh" }}
        >
          <FontAwesomeIcon icon={faClipboardList} className="display-6 mb-2" />
          <div>
            <h4 className="fw-semibold mb-1">{t("core.noJobsTitle")}</h4>
            <p className="opacity-75 mb-2">{t("core.noJobsSubtitle")}</p>
          </div>
          <div>
            <Button label={t("core.exploreBtn")} to="/explore" />
          </div>
        </div>
      )}
    </div>
  );

  if (selectedJobs || showNoJobs) {
    return (
      <>
        {panel ? (
          <Panel
            {...{ className: "fy-inference-jobs-list rounded", padding: true }}
          >
            {jobContent}
          </Panel>
        ) : (
          <>{jobContent}</>
        )}
      </>
    );
  } else {
    return null;
  }
}
