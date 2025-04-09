import React, { useCallback, useEffect, useState } from "react";
import { WebUrl } from "../../../../../common/WebUrl";
import { BackLink } from "../../../_common/BackLink";
import {
  GetVoiceInventoryStats,
  GetVoiceInventoryStatsIsOk,
} from "@storyteller/components/src/api/moderation/stats/GetVoiceInventoryStats";
import { useSession } from "hooks";

export default function ModerationVoiceStatsFc() {
  const { sessionWrapper } = useSession();
  const [allVoicesCount, setAllVoicesCount] = useState<number>(-1);
  const [publicVoicesCount, setPublicVoicesCount] = useState<number>(-1);

  const getVoiceStats = useCallback(async () => {
    const response = await GetVoiceInventoryStats();
    if (GetVoiceInventoryStatsIsOk(response)) {
      setAllVoicesCount(response.all_voices_count_including_deleted);
      setPublicVoicesCount(response.public_voices_count);
    }
  }, []);

  const reloadStats = useCallback(async () => {
    getVoiceStats();
  }, [getVoiceStats]);

  useEffect(() => {
    reloadStats();
  }, [reloadStats]);

  if (allVoicesCount === -1 && publicVoicesCount === -1) {
    return <div />;
  }

  if (!sessionWrapper.canEditOtherUsersTtsModels()) {
    return <h1>Unauthorized</h1>;
  }

  return (
    <div className="container pt-5">
      <h1 className="fw-bold"> Voice Stats </h1>

      <BackLink link={WebUrl.moderationMain()} text="Back to moderation" />

      <br />
      <br />

      <table className="table is-fullwidth">
        <tbody>
          <tr>
            <th>Public voice vount</th>
            <td>{publicVoicesCount} voices </td>
          </tr>
          <tr>
            <th>All voice count (incl banned)</th>
            <td>{allVoicesCount} voices </td>
          </tr>
        </tbody>
      </table>

      <br />
      <button className="btn btn-primary w-100" onClick={() => reloadStats()}>
        Reload
      </button>
    </div>
  );
}
