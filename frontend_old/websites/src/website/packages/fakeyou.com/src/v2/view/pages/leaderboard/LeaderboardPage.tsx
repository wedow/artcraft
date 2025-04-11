import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WebUrl } from "common/WebUrl";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import {
  GetLeaderboard,
  GetLeaderboardIsErr,
  GetLeaderboardIsOk,
  Leaderboard,
  LeaderboardRow,
  LeaderboardLookupError,
} from "@storyteller/components/src/api/leaderboard/GetLeaderboard";
import { DiscordLink2 } from "@storyteller/components/src/elements/DiscordLink2";

import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | undefined>(
    undefined
  );
  const [ttsLeaderboard, setTtsLeaderboard] = useState<
    Array<LeaderboardRow> | undefined
  >(undefined);
  const [w2lLeaderboard, setW2lLeaderboard] = useState<
    Array<LeaderboardRow> | undefined
  >(undefined);
  const [retryCount, setRetryCount] = useState(0);

  PosthogClient.recordPageview();

  const getLeaderboard = useCallback(async () => {
    const leaderboardReponse = await GetLeaderboard();

    if (GetLeaderboardIsOk(leaderboardReponse)) {
      setLeaderboard(leaderboardReponse);
      setTtsLeaderboard(leaderboardReponse.tts_leaderboard);
      setW2lLeaderboard(leaderboardReponse.w2l_leaderboard);
    } else if (GetLeaderboardIsErr(leaderboardReponse)) {
      switch (leaderboardReponse) {
        // TODO: There's an issue with the queries not returning before the deadline.
        // I should add a Redis TTL cache to store the results and an async job to warm the cache.
        case LeaderboardLookupError.NotFound:
          if (retryCount < 3) {
            setTimeout(() => getLeaderboard(), 1000);
            setRetryCount(retryCount + 1);
          }
          break;
      }
    }
  }, [retryCount]);

  useEffect(() => {
    getLeaderboard();
  }, [getLeaderboard]);

  usePrefixedDocumentTitle("Leaderboard of Top Contributors");

  if (!leaderboard) {
    return <div />;
  }

  let ttsRows: Array<JSX.Element> = [];

  if (ttsLeaderboard) {
    ttsLeaderboard.forEach(ttsEntry => {
      ttsRows.push(
        <tr>
          <td className="lb-name">
            <Link
              to={WebUrl.userProfilePage(ttsEntry.display_name)}
              className="d-flex align-items-center gap-2"
            >
              <Gravatar
                size={32}
                username={ttsEntry.display_name}
                email_hash={ttsEntry.gravatar_hash}
                avatarIndex={ttsEntry.default_avatar_index}
                backgroundIndex={ttsEntry.default_avatar_color_index}
              />
              {ttsEntry.display_name}
            </Link>
          </td>
          <td>{ttsEntry.uploaded_count}</td>
        </tr>
      );
    });
  }

  let w2lRows: Array<JSX.Element> = [];

  if (w2lLeaderboard) {
    w2lLeaderboard.forEach(w2lEntry => {
      w2lRows.push(
        <tr>
          <td className="lb-name">
            <Link
              to={WebUrl.userProfilePage(w2lEntry.display_name)}
              className="d-flex align-items-center gap-2"
            >
              <Gravatar
                size={32}
                username={w2lEntry.display_name}
                email_hash={w2lEntry.gravatar_hash}
                avatarIndex={w2lEntry.default_avatar_index}
                backgroundIndex={w2lEntry.default_avatar_color_index}
              />
              {w2lEntry.display_name}
            </Link>
          </td>
          <td>{w2lEntry.uploaded_count}</td>
        </tr>
      );
    });
  }

  return (
    <div>
      <div className="container py-5 px-md-4 px-lg-5 px-xl-3">
        <div className="d-flex flex-column">
          <h1 className=" fw-bold">Leaderboard</h1>
          <h3 className="mb-4">Our most frequent contributors!</h3>
          <p className="lead">
            Want to be on the leaderboard?{" "}
            <DiscordLink2>Join our Discord</DiscordLink2> and learn more!
          </p>
        </div>
      </div>

      <div className="container-panel pt-5 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">TTS Models Uploaded</h2>
          <div className="py-6">
            <table className="table">
              <tbody>{ttsRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="container-panel pt-3 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">W2L Templates Uploaded</h2>
          <div className="py-6">
            <table className="table">
              <tbody>{w2lRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
