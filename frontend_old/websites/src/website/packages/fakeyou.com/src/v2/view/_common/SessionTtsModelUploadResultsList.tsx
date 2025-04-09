import React from "react";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { useInferenceJobs } from "hooks";
import { Button, Panel } from "components/common";

// interface Props {}

function SessionTtsModelUploadResultList() {
  const { inferenceJobsByCategory } = useInferenceJobs();
  let results: Array<JSX.Element> = [];

  inferenceJobsByCategory
    .get(FrontendInferenceJobType.TextToSpeech)
    .forEach((job: InferenceJob) => {
      if (!job.maybeModelToken) {
        let stateDescription = "Pending...";

        switch (job.jobState) {
          case JobState.PENDING:
          case JobState.UNKNOWN:
            stateDescription =
              job.maybeExtraStatusDescription == null
                ? "Pending..."
                : job.maybeExtraStatusDescription;
            break;
          case JobState.STARTED:
            stateDescription =
              job.maybeExtraStatusDescription == null
                ? "Started..."
                : job.maybeExtraStatusDescription;
            break;
          case JobState.ATTEMPT_FAILED:
            stateDescription = `Failed ${job.attemptCount} attempt(s). Will retry...`;
            break;
          case JobState.COMPLETE_FAILURE:
          case JobState.DEAD:
            stateDescription =
              "Failed Permanently. Please tell us in Discord so we can fix. :(";
            break;
          case JobState.COMPLETE_SUCCESS:
            stateDescription = "Success!"; // Not sure why we're here instead of other branch!
            break;
        }

        results.push(
          <div key={job.jobToken}>
            <div className="alert alert-primary">{stateDescription}</div>
          </div>
        );
      } else {
        let ttsPermalink = `/weight/${job.maybeModelToken}`;

        results.push(
          <Panel padding={true} key={job.jobToken}>
            <div className="d-flex align-items-center">
              <span className="flex-grow-1 fs-5 fw-medium">Complete!</span>
              <div>
                <Button
                  variant="secondary"
                  label="See &amp; use TTS model"
                  to={ttsPermalink}
                />
              </div>
            </div>
          </Panel>
        );
      }
    });

  let title = <span />;
  if (results.length !== 0) {
    title = (
      <h2 className="text-center text-lg-start fw-bold">
        TTS Model Upload Status
      </h2>
    );
  }

  let noResultsSection = <></>;

  if (results.length === 0) {
    return <>{noResultsSection}</>;
  }

  return (
    <div>
      <div className="pb-4">{title}</div>
      <div className="d-flex flex-column gap-4">{results}</div>
    </div>
  );
}

export { SessionTtsModelUploadResultList };
