import React, { useState, useEffect, useCallback } from "react";
import { ApiConfig } from "@storyteller/components";
import { WebUrl } from "../../../../../common/WebUrl";
import { useParams, Link, useHistory } from "react-router-dom";
import {
  GetW2lResult,
  GetW2lResultIsOk,
  W2lResult,
} from "@storyteller/components/src/api/w2l/GetW2lResult";
import { useSession } from "hooks";

import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

export default function W2lResultDeletePage() {
  const history = useHistory();
  PosthogClient.recordPageview();
  const { sessionWrapper } = useSession();

  let { token } = useParams() as { token: string };

  const [w2lInferenceResult, setW2lInferenceResult] = useState<
    W2lResult | undefined
  >(undefined);

  const getInferenceResult = useCallback(async token => {
    const templateResponse = await GetW2lResult(token);
    if (GetW2lResultIsOk(templateResponse)) {
      setW2lInferenceResult(templateResponse);
    }
  }, []);

  useEffect(() => {
    getInferenceResult(token);
  }, [token, getInferenceResult]);

  const templateResultLink = WebUrl.w2lResultPage(token);

  const handleDeleteFormSubmit = (
    ev: React.FormEvent<HTMLFormElement>
  ): boolean => {
    ev.preventDefault();

    const endpointUrl = new ApiConfig().deleteW2lInferenceResult(token);

    const request = {
      set_delete: !currentlyDeleted,
      as_mod: sessionWrapper.canDeleteOtherUsersW2lResults(),
    };

    fetch(endpointUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          if (sessionWrapper.canDeleteOtherUsersW2lResults()) {
            history.push(templateResultLink); // Mods can perform further actions
          } else {
            history.push("/");
          }
        }
      })
      .catch(e => {});
    return false;
  };

  let creatorLink = <span />;

  if (!!w2lInferenceResult?.maybe_creator_display_name) {
    const creatorUrl = WebUrl.userProfilePage(
      w2lInferenceResult?.maybe_creator_display_name
    );
    creatorLink = (
      <Link to={creatorUrl}>
        {w2lInferenceResult?.maybe_creator_display_name}
      </Link>
    );
  }

  let currentlyDeleted =
    !!w2lInferenceResult?.maybe_moderator_fields?.mod_deleted_at ||
    !!w2lInferenceResult?.maybe_moderator_fields?.result_creator_deleted_at;

  const h1Title = currentlyDeleted ? "Undelete Result?" : "Delete Result?";

  const buttonTitle = currentlyDeleted ? "Confirm Undelete" : "Confirm Delete";

  const buttonCss = currentlyDeleted
    ? "btn btn-primary w-100"
    : "btn btn-primary w-100";

  const formLabel = currentlyDeleted
    ? "Recover the W2L Result (makes it visible again)"
    : "Delete W2L Result (hides from everyone but mods)";

  const durationSeconds = (w2lInferenceResult?.duration_millis || 0) / 1000;

  return (
    <div>
      <div className="container pt-5 pb-4 px-md-4 px-lg-5 px-xl-3">
        <h1 className=" fw-bold">{h1Title}</h1>
        <div className="pt-3">
          <Link to={templateResultLink}>&lt; Back to result</Link>
        </div>
      </div>

      <form onSubmit={handleDeleteFormSubmit}>
        <div className="container-panel pt-4 pb-5">
          <div className="panel p-3 py-4 p-lg-4">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <abbr title="Detail">Detail</abbr>
                  </th>
                  <th>
                    <abbr title="Value">Value</abbr>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Creator</th>
                  <td>{creatorLink}</td>
                </tr>
                <tr>
                  <th>Template title</th>
                  <td>{w2lInferenceResult?.template_title}</td>
                </tr>
                <tr>
                  <th>Duration</th>
                  <td>{durationSeconds} seconds</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="container pb-5">
          <button className={buttonCss}>{buttonTitle}</button>
          <p className="pt-4">{formLabel}</p>
        </div>
      </form>
    </div>
  );
}
