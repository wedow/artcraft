import React from "react";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import { TtsInferenceJob } from "@storyteller/components/src/jobs/TtsInferenceJobs";

interface Props {
  ttsInferenceJobs: Array<TtsInferenceJob>;
}

function TtsResultsList(props: Props) {
  let results: Array<JSX.Element> = [];

  props.ttsInferenceJobs.forEach((job) => {
    if (!job.maybeResultToken) {
      let cssStyle = "message";
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
          cssStyle = "message is-primary";
          stateDescription =
            job.maybeExtraStatusDescription == null
              ? "Started..."
              : job.maybeExtraStatusDescription;
          break;
        case JobState.ATTEMPT_FAILED:
          cssStyle = "message is-warning";
          stateDescription = `Failed ${job.attemptCount} attempt(s). Will retry...`;
          break;
        case JobState.COMPLETE_FAILURE:
        case JobState.DEAD:
          cssStyle = "message is-danger";
          stateDescription =
            "Failed Permanently. Please tell us in Discord so we can fix. :(";
          break;
        case JobState.COMPLETE_SUCCESS:
          cssStyle = "message is-success";
          stateDescription = "Success!"; // Not sure why we're here instead of other branch!
          break;
      }

      results.push(
        <div key={job.jobToken}>
          <div className={cssStyle}>
            <div className="message-body">
              <p>{stateDescription}</p>
            </div>
          </div>
          &nbsp;
        </div>
      );
    } else {
      let audioLink = new BucketConfig().getGcsUrl(
        job.maybePublicBucketWavAudioPath
      );
      let ttsPermalink = `https://fakeyou.com/tts/result/${job.maybeResultToken}`;
      results.push(
        <div key={job.jobToken}>
          {/*<div className="message-header">
              <p>{job.title}</p>
              <button className="delete" aria-label="delete"></button>
            </div>*/}
          <div className="card bg-dark-solid text-start align-items-start p-3 p-lg-4">
            <strong className="fw-bold mb-1">{job.title}</strong>
            <p className="fs-6">{job.rawInferenceText}</p>
            <audio className="w-100" controls src={audioLink}>
              Your browser does not support the
              <code>audio</code> element.
            </audio>
            &nbsp;
            <a
              rel="noreferrer"
              target="_blank"
              href={ttsPermalink}
              className="btn btn-primary w-100"
            >
              Permalink &amp; Download
            </a>
          </div>
        </div>
      );
    }
  });

  if (results.length === 0) {
    return <span />;
  }

  let title = <span />;
  if (results.length !== 0) {
    title = (
      <>
        <div className="mt-5 mb-2 d-flex flex-column gap-3">
          <h4 className="fw-bold">TTS Results</h4>
          <div className="alert alert-warning fw-normal">
            Please note that we're currently recieving massive amounts of
            traffic. Creating an account on FakeYou.com places you into a higher
            priority queue.
          </div>
        </div>
      </>
    );
  }

  // Users have requested reverse chronological results
  results.reverse();

  return (
    <div className="mb-5">
      {title}
      {/*<div className="notification is-info is-light">
        <strong>Working on speeding this up</strong> 
        <p>
          Sorry this is slow. I'm scaling the cluster and fixing the caching strategy.
        </p>
      </div>*/}
      <div className="d-flex flex-column gap-3">{results}</div>
    </div>
  );
}

export { TtsResultsList };
