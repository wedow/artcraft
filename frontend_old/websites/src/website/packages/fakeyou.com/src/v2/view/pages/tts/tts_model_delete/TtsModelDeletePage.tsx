import React, { useState, useEffect, useCallback } from "react";
import { ApiConfig } from "@storyteller/components";
import { WebUrl } from "../../../../../common/WebUrl";
import { useParams, Link, useHistory } from "react-router-dom";
import { BackLink } from "../../../_common/BackLink";
import { useSession } from "hooks";

import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

interface TtsModelViewResponsePayload {
  success: boolean;
  model: TtsModel;
}

interface TtsModelUseCountResponsePayload {
  success: boolean;
  count: number | null | undefined;
}

interface TtsModel {
  model_token: string;
  title: string;
  tts_model_type: string;
  text_preprocessing_algorithm: string;
  creator_user_token: string;
  creator_username: string;
  creator_display_name: string;
  description_markdown: string;
  description_rendered_html: string;
  updatable_slug: string;
  created_at: string;
  updated_at: string;
  maybe_moderator_fields: TtsModelModeratorFields | null | undefined;
}

interface TtsModelModeratorFields {
  creator_ip_address_creation: string;
  creator_ip_address_last_update: string;
  mod_deleted_at: string | undefined | null;
  user_deleted_at: string | undefined | null;
}

export default function TtsModelDeletePage() {
  PosthogClient.recordPageview();
  const history = useHistory();
  const { token } = useParams() as { token: string };
  const { sessionWrapper } = useSession();

  const [ttsModel, setTtsModel] = useState<TtsModel | undefined>(undefined);
  const [ttsModelUseCount, setTtsModelUseCount] = useState<number | undefined>(
    undefined
  );

  const getModel = useCallback(token => {
    const api = new ApiConfig();
    const endpointUrl = api.viewTtsModel(token);

    fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        const modelsResponse: TtsModelViewResponsePayload = res;
        if (!modelsResponse.success) {
          return;
        }

        setTtsModel(modelsResponse.model);
      })
      .catch(e => {});
  }, []);

  const getModelUseCount = useCallback(token => {
    const api = new ApiConfig();
    const endpointUrl = api.getTtsModelUseCount(token);

    fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        const modelsResponse: TtsModelUseCountResponsePayload = res;
        if (!modelsResponse.success) {
          return;
        }

        setTtsModelUseCount(modelsResponse.count || 0);
      })
      .catch(e => {});
  }, []);

  useEffect(() => {
    getModel(token);
    getModelUseCount(token);
  }, [token, getModel, getModelUseCount]);

  const modelLink = WebUrl.ttsModelPage(token);

  const handleDeleteFormSubmit = (
    ev: React.FormEvent<HTMLFormElement>
  ): boolean => {
    ev.preventDefault();

    const api = new ApiConfig();
    const endpointUrl = api.deleteTtsModel(token);

    const request = {
      set_delete: !currentlyDeleted,
      as_mod: sessionWrapper.deleteTtsResultAsMod(ttsModel?.creator_user_token),
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
          if (sessionWrapper.canDeleteOtherUsersTtsResults()) {
            history.push(modelLink); // Mods can perform further actions
          } else {
            history.push("/");
          }
        }
      })
      .catch(e => {});
    return false;
  };

  let creatorLink = <span />;

  if (!!ttsModel?.creator_display_name) {
    const creatorUrl = WebUrl.userProfilePage(ttsModel?.creator_display_name);
    creatorLink = <Link to={creatorUrl}>{ttsModel?.creator_display_name}</Link>;
  }

  let currentlyDeleted =
    !!ttsModel?.maybe_moderator_fields?.mod_deleted_at ||
    !!ttsModel?.maybe_moderator_fields?.user_deleted_at;

  const h1Title = currentlyDeleted ? "Undelete Model?" : "Delete Model?";

  const buttonTitle = currentlyDeleted ? "Confirm Undelete" : "Confirm Delete";

  const buttonCss = currentlyDeleted
    ? "btn btn-primary w-100"
    : "btn btn-primary w-100";

  const formLabel = currentlyDeleted
    ? "Recover the TTS Model (makes it visible again)"
    : "Delete TTS Model (hides from everyone but mods)";

  let humanUseCount: string | number = "Fetching...";

  if (ttsModelUseCount !== undefined && ttsModelUseCount !== null) {
    humanUseCount = ttsModelUseCount;
  }

  let moderatorRows = null;

  if (
    sessionWrapper.canDeleteOtherUsersTtsResults() ||
    sessionWrapper.canDeleteOtherUsersTtsModels()
  ) {
    moderatorRows = (
      <>
        <tr>
          <th>Creator IP Address (Creation)</th>
          <td>
            {ttsModel?.maybe_moderator_fields?.creator_ip_address_creation ||
              "server error"}
          </td>
        </tr>
        <tr>
          <th>Creator IP Address (Update)</th>
          <td>
            {ttsModel?.maybe_moderator_fields?.creator_ip_address_last_update ||
              "server error"}
          </td>
        </tr>
        <tr>
          <th>Mod Deleted At (UTC)</th>
          <td>
            {ttsModel?.maybe_moderator_fields?.mod_deleted_at || "not deleted"}
          </td>
        </tr>
        <tr>
          <th>User Deleted At (UTC)</th>
          <td>
            {ttsModel?.maybe_moderator_fields?.user_deleted_at || "not deleted"}
          </td>
        </tr>
      </>
    );
  }

  return (
    <div>
      <div className="container py-5 pb-4 px-lg-5 px-xl-3">
        <div className="d-flex flex-column">
          <h1 className=" fw-bold mb-3">{h1Title}</h1>
          <p>
            <BackLink link={modelLink} text="Back to model" />
          </p>
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
                  <th>Use Count</th>
                  <td>{humanUseCount}</td>
                </tr>
                <tr>
                  <th>Title</th>
                  <td>{ttsModel?.title}</td>
                </tr>
                <tr>
                  <th>Model Type</th>
                  <td>{ttsModel?.tts_model_type}</td>
                </tr>
                <tr>
                  <th>Text Preprocessing Algorithm</th>
                  <td>{ttsModel?.text_preprocessing_algorithm}</td>
                </tr>
                <tr>
                  <th>Upload Date (UTC)</th>
                  <td>{ttsModel?.created_at}</td>
                </tr>

                {moderatorRows}
              </tbody>
            </table>
          </div>
        </div>

        <div className="container pb-5">
          <button className={buttonCss}>{buttonTitle}</button>
          <label className="pt-4">{formLabel}</label>
        </div>
      </form>
    </div>
  );
}
