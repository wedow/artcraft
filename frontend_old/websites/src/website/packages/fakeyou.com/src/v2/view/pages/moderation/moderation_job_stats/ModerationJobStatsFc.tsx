import React, { useCallback, useEffect, useState } from "react";
import { WebUrl } from "../../../../../common/WebUrl";
import { BackLink } from "../../../_common/BackLink";
import {
  GetTtsInferenceStats,
  GetTtsInferenceStatsIsOk,
} from "@storyteller/components/src/api/moderation/stats/GetTtsInferenceStats";
import {
  GetW2lInferenceStats,
  GetW2lInferenceStatsIsOk,
} from "@storyteller/components/src/api/moderation/stats/GetW2lInferenceStats";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBomb, faRedo } from "@fortawesome/free-solid-svg-icons";
import {
  KillAction,
  KillTtsInferenceJobsIsSuccess,
  KillTtsInferenceJobs,
} from "@storyteller/components/src/api/moderation/tts/KillTtsInferenceJobs";
import { useSession } from "hooks";

export default function ModerationJobStatsFc() {
  const { sessionWrapper } = useSession();
  // NB: We have more TTS stats than W2L stats now.
  const [ttsSecondsSinceFirst, setTtsSecondsSinceFirst] = useState<number>(-1);
  const [ttsPendingJobCount, setTtsPendingJobCount] = useState<number>(-1);
  const [
    ttsPendingPriorityNonzeroJobCount,
    setTtsPendingPriorityNonzeroJobCount,
  ] = useState<number>(-1);
  const [ttsPendingPriorityGtOneJobCount, setTtsPendingPriorityGtOneJobCount] =
    useState<number>(-1);
  const [ttsAttemptFailedJobCount, setTtsAttemptFailedJobCount] =
    useState<number>(-1);

  const [w2lPendingJobCount, setW2lPendingJobCount] = useState<number>(-1);
  const [w2lSecondsSinceFirst, setW2lSecondsSinceFirst] = useState<number>(-1);

  const getTtsStats = useCallback(async () => {
    const response = await GetTtsInferenceStats();
    if (GetTtsInferenceStatsIsOk(response)) {
      setTtsSecondsSinceFirst(response.seconds_since_first);
      setTtsPendingJobCount(response.pending_count);
      setTtsPendingPriorityNonzeroJobCount(
        response.pending_priority_nonzero_count
      );
      setTtsPendingPriorityGtOneJobCount(
        response.pending_priority_gt_one_count
      );
      setTtsAttemptFailedJobCount(response.attempt_failed_count);
    }
  }, []);

  const getW2lStats = useCallback(async () => {
    const response = await GetW2lInferenceStats();
    if (GetW2lInferenceStatsIsOk(response)) {
      setW2lPendingJobCount(response.pending_count);
      setW2lSecondsSinceFirst(response.seconds_since_first);
    }
  }, []);

  const reloadStats = useCallback(async () => {
    getTtsStats();
    getW2lStats();
  }, [getTtsStats, getW2lStats]);

  useEffect(() => {
    reloadStats();
  }, [reloadStats]);

  const killPending = async () => {
    await doKill(KillAction.AllPending);
  };

  const killPendingAndFailed = async () => {
    await doKill(KillAction.AllPendingAndFailed);
  };

  const killZeroPriorityPending = async () => {
    await doKill(KillAction.ZeroPriorityPending);
  };

  const doKill = async (killAction: KillAction) => {
    const response = await KillTtsInferenceJobs(killAction);

    if (KillTtsInferenceJobsIsSuccess(response)) {
      reloadStats();
    }
  };

  if (ttsPendingJobCount === -1 && w2lPendingJobCount === -1) {
    return <div />;
  }

  if (!sessionWrapper.canBanUsers()) {
    return <h1>Unauthorized</h1>;
  }

  let ttsWait = humanWaitTime(ttsSecondsSinceFirst);
  let w2lWait = humanWaitTime(w2lSecondsSinceFirst);

  return (
    <div>
      <div className="container py-5">
        <h1 className=" fw-bold">Job Stats</h1>
        <div className="pt-3">
          <BackLink link={WebUrl.moderationMain()} text="Back to moderation" />
        </div>
      </div>

      <div className="container-panel pt-3 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">TTS Stats</h2>
          <div className="py-6">
            <table className="table is-fullwidth is-bordered is-striped">
              <thead>
                <tr>
                  <th colSpan={2} className="is-info">
                    <u>Misc Stats</u>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>TTS wait time</th>
                  <td>{ttsWait}</td>
                </tr>
              </tbody>
              <thead>
                <tr>
                  <th colSpan={2} className="is-info">
                    <u>Failed Jobs by Type</u>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Pending Jobs (All)</th>
                  <td>{ttsPendingJobCount} pending </td>
                </tr>
                <tr>
                  <th>Pending Jobs (Priority &gt; 0)</th>
                  <td>{ttsPendingPriorityNonzeroJobCount} pending </td>
                </tr>
                <tr>
                  <th>Pending Jobs (Priority &gt; 1)</th>
                  <td>{ttsPendingPriorityGtOneJobCount} pending </td>
                </tr>
                <tr>
                  <th>Failed Jobs w/ Retry</th>
                  <td>{ttsAttemptFailedJobCount} pending </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="container-panel pt-3 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">W2L Stats</h2>
          <div className="py-6">
            <table className="table is-fullwidth is-bordered is-striped">
              <thead>
                <tr>
                  <th colSpan={2} className="is-info">
                    <u>Misc Stats</u>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>W2L wait time</th>
                  <td>{w2lWait}</td>
                </tr>
              </tbody>
              <thead>
                <tr>
                  <th colSpan={2} className="is-info">
                    <u>Failed Jobs by Type</u>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Pending Jobs (All)</th>
                  <td>{w2lPendingJobCount} pending </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="container-panel pt-3 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">Reload Job Stats</h2>
          <div className="py-6">
            <button
              className="btn btn-primary w-100"
              onClick={() => reloadStats()}
            >
              <FontAwesomeIcon icon={faRedo} className="me-2" />
              Reload
            </button>
          </div>
        </div>
      </div>

      <div className="container-panel pt-3 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">Kill Stuck Jobs (Danger Zone)</h2>
          <div className="py-6">
            <h5 className="fw-semibold mb-4">(Please don't do this.)</h5>
            <div className="d-flex flex-column gap-3">
              <button
                className="btn btn-destructive w-100"
                onClick={() => killZeroPriorityPending()}
              >
                Kill Zero-Priority Pending TTS
              </button>

              <button
                className="btn btn-destructive w-100"
                onClick={() => killPending()}
              >
                Kill ALL Pending TTS&nbsp;
                <FontAwesomeIcon icon={faBomb} />
              </button>

              <button
                className="btn btn-destructive w-100"
                onClick={() => killPendingAndFailed()}
              >
                Kill ALL Pending and Failed TTS&nbsp;
                <FontAwesomeIcon icon={faBomb} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-5">
        <BackLink link={WebUrl.moderationMain()} text="Back to moderation" />
      </div>
    </div>
  );
}

function humanWaitTime(seconds: number): string {
  if (seconds === -1) {
    return "error";
  } else if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 60 * 60) {
    return `${(seconds / 60).toFixed(1)} minutes`;
  } else {
    return `${(seconds / (60 * 60)).toFixed(1)} hours`;
  }
}
