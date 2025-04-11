import React from "react";
import { Link } from "react-router-dom";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList } from "@fortawesome/free-solid-svg-icons";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { useInferenceJobs } from "hooks";

// interface Props {}

function SessionW2lInferenceResultList() {
  let results: Array<JSX.Element> = [];
  const { inferenceJobsByCategory } = useInferenceJobs();

  inferenceJobsByCategory(FrontendInferenceJobType.VoiceConversion).forEach(
    (job: InferenceJob) => {
      if (!job.maybeResultToken) {
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
        let w2lPermalink = `/w2l/result/${job.maybeResultToken}`;

        results.push(
          <div key={job.jobToken}>
            <div className="panel py-4 p-3 p-lg-4 gap-4">
              Complete!{" "}
              <Link to={w2lPermalink} className="btn btn-primary ms-4">
                Permalink &amp; download
              </Link>
            </div>
          </div>
        );
      }
    }
  );

  let title = <span />;
  if (results.length !== 0) {
    title = (
      <h2 className="text-center text-lg-start fw-bold">
        <FontAwesomeIcon icon={faList} className="me-3" />
        Session W2L Results
      </h2>
    );
  }

  let noResultsSection = <></>;

  if (results.length === 0) {
    return <>{noResultsSection}</>;
  }

  return (
    <div>
      <div className="container-panel pt-4 pb-5">
        <div className="pb-4">{title}</div>
        <div className="d-flex flex-column gap-4">{results}</div>
      </div>
    </div>
  );
}

export { SessionW2lInferenceResultList };
