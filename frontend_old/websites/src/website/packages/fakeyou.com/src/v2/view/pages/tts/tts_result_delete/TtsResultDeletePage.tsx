import React, { useState, useEffect } from "react";
import { ApiConfig } from "@storyteller/components";
import { useParams, Link, useHistory } from "react-router-dom";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { WebUrl } from "../../../../../common/WebUrl";
import { useSession } from "hooks";

import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

interface TtsInferenceResultResponsePayload {
  success: boolean;
  result: TtsInferenceResult;
}

interface TtsInferenceResult {
  tts_result_token: string;

  tts_model_token: string;
  tts_model_title: string;

  raw_inference_text: string;

  maybe_creator_user_token?: string;
  maybe_creator_username?: string;
  maybe_creator_display_name?: string;
  maybe_creator_gravatar_hash?: string;

  maybe_model_creator_user_token?: string;
  maybe_model_creator_username?: string;
  maybe_model_creator_display_name?: string;
  maybe_model_creator_gravatar_hash?: string;

  public_bucket_wav_audio_path: string;
  public_bucket_spectrogram_path: string;

  file_size_bytes: number;
  duration_millis: number;
  created_at: string;
  updated_at: string;

  maybe_moderator_fields: TtsInferenceResultModeratorFields | null | undefined;
}

interface TtsInferenceResultModeratorFields {
  creator_ip_address: string;
  mod_deleted_at: string | undefined | null;
  user_deleted_at: string | undefined | null;
}

export default function TtsResultDeletePage() {
  const history = useHistory();
  const { sessionWrapper } = useSession();
  PosthogClient.recordPageview();

  let { token }: { token: string } = useParams();

  const [ttsInferenceResult, setTtsInferenceResult] = useState<
    TtsInferenceResult | undefined
  >(undefined);

  useEffect(() => {
    const api = new ApiConfig();
    const endpointUrl = api.viewTtsInferenceResult(token);

    fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        const modelsResponse: TtsInferenceResultResponsePayload = res;
        if (!modelsResponse.success) {
          return;
        }

        setTtsInferenceResult(modelsResponse.result);
      })
      .catch(e => {
        //this.props.onSpeakErrorCallback();
      });
  }, [token]); // NB: Empty array dependency sets to run ONLY on mount

  const currentlyDeleted =
    !!ttsInferenceResult?.maybe_moderator_fields?.mod_deleted_at ||
    !!ttsInferenceResult?.maybe_moderator_fields?.user_deleted_at;

  const resultLink = WebUrl.ttsResultPage(token);

  const handleDeleteFormSubmit = (
    ev: React.FormEvent<HTMLFormElement>
  ): boolean => {
    ev.preventDefault();

    const api = new ApiConfig();
    const endpointUrl = api.deleteTtsInferenceResult(token);

    const request = {
      set_delete: !currentlyDeleted,
      as_mod: sessionWrapper.deleteTtsResultAsMod(
        ttsInferenceResult?.maybe_creator_user_token
      ),
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
            history.push(resultLink); // Mods can perform further actions
          } else {
            history.push("/");
          }
        }
      })
      .catch(e => {});
    return false;
  };

  if (ttsInferenceResult === undefined) {
    return <div />; // Exit rendering until data loads.
  }

  const modelLink = WebUrl.ttsModelPage(ttsInferenceResult.tts_model_token);

  let durationSeconds = ttsInferenceResult?.duration_millis / 1000;
  let modelName = ttsInferenceResult.tts_model_title;

  let creatorDetails = <span>Anonymous user</span>;
  if (!!ttsInferenceResult.maybe_creator_user_token) {
    let creatorLink = `/profile/${ttsInferenceResult.maybe_creator_username}`;
    creatorDetails = (
      <span>
        <Gravatar
          size={15}
          username={ttsInferenceResult.maybe_creator_display_name || ""}
          email_hash={ttsInferenceResult.maybe_creator_gravatar_hash || ""}
        />
        &nbsp;
        <Link to={creatorLink}>
          {ttsInferenceResult.maybe_creator_display_name}
        </Link>
      </span>
    );
  }

  let modelCreatorDetails = <span>Anonymous user</span>;
  if (!!ttsInferenceResult.maybe_model_creator_user_token) {
    let modelCreatorLink = `/profile/${ttsInferenceResult.maybe_model_creator_username}`;
    modelCreatorDetails = (
      <span>
        <Gravatar
          size={15}
          username={ttsInferenceResult.maybe_model_creator_display_name || ""}
          email_hash={
            ttsInferenceResult.maybe_model_creator_gravatar_hash || ""
          }
        />
        &nbsp;
        <Link to={modelCreatorLink}>
          {ttsInferenceResult.maybe_model_creator_display_name}
        </Link>
      </span>
    );
  }

  const h1Title = currentlyDeleted ? "Undelete Result?" : "Delete Result?";

  const buttonTitle = currentlyDeleted ? "Confirm Undelete" : "Confirm Delete";

  const formLabel = currentlyDeleted
    ? "Recover the TTS Result (makes it visible again)"
    : "Delete TTS Result (hides from everyone but mods)";

  return (
    <div>
      <div className="container pt-5 pb-4 px-lg-5 px-xl-3">
        <h1 className=" fw-bold mb-3">{h1Title}</h1>
        <div>
          <Link to={resultLink}>&lt; Back to result</Link>
        </div>
      </div>

      <form onSubmit={handleDeleteFormSubmit}>
        <div className="container-panel pt-4 pb-5">
          <div className="panel p-3 p-lg-4">
            <table className="table tts-result-table">
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
                  <th>Original Text</th>
                  <td className="overflow-fix">
                    {ttsInferenceResult.raw_inference_text}
                  </td>
                </tr>
                <tr>
                  <th>Audio Creator</th>
                  <td>{creatorDetails}</td>
                </tr>
                <tr>
                  <th>Model used</th>
                  <td>
                    <Link to={modelLink}>{modelName}</Link>
                  </td>
                </tr>
                <tr>
                  <th>Model creator</th>
                  <td>{modelCreatorDetails}</td>
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
          <button className=" btn btn-primary w-100">{buttonTitle}</button>
          <p className="mt-4">{formLabel}</p>
        </div>
      </form>
    </div>
  );
}
