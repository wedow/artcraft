import React, { useState, useEffect, useCallback } from "react";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { useParams, Link } from "react-router-dom";
import { ReportDiscordLink } from "../../../_common/DiscordReportLink";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import { HiddenIconFc } from "../../../_icons/HiddenIcon";
import { VisibleIconFc } from "../../../_icons/VisibleIcon";
import { WebUrl } from "../../../../../common/WebUrl";
import {
  GetW2lResult,
  GetW2lResultIsErr,
  GetW2lResultIsOk,
  W2lResult,
  W2lResultLookupError,
} from "@storyteller/components/src/api/w2l/GetW2lResult";
import { MetaTags } from "../../../../../common/MetaTags";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

import { usePrefixedDocumentTitle } from "../../../../../common/UsePrefixedDocumentTitle";
import { CommentComponent } from "../../../_common/comments/CommentComponent";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { useSession } from "hooks";

export default function W2lResultViewPage() {
  let { token } = useParams() as { token: string };
  const { sessionWrapper } = useSession();

  PosthogClient.recordPageview();

  const [w2lInferenceResult, setW2lInferenceResult] = useState<
    W2lResult | undefined
  >(undefined);
  const [notFoundState, setNotFoundState] = useState<boolean>(false);

  const getInferenceResult = useCallback(async token => {
    const templateResponse = await GetW2lResult(token);
    if (GetW2lResultIsOk(templateResponse)) {
      setW2lInferenceResult(templateResponse);
    } else if (GetW2lResultIsErr(templateResponse)) {
      switch (templateResponse) {
        case W2lResultLookupError.NotFound:
          setNotFoundState(true);
          break;
      }
    }
  }, []);

  useEffect(() => {
    getInferenceResult(token);
  }, [token, getInferenceResult]); // NB: Empty array dependency sets to run ONLY on mount

  const documentTitle =
    w2lInferenceResult?.template_title === undefined
      ? undefined
      : `Deep Fake ${w2lInferenceResult.template_title} Lip Sync Video Result`;
  usePrefixedDocumentTitle(documentTitle);

  if (notFoundState) {
    return (
      <div className="container py-5">
        <div className="py-5">
          <h1 className="fw-semibold text-center mb-4">
            Template result not found
          </h1>
          <div className="text-center">
            <Link className="btn btn-primary" to="/">
              Back to main
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!w2lInferenceResult) {
    return <div />;
  }

  let videoLink = new BucketConfig().getGcsUrl(
    w2lInferenceResult?.public_bucket_video_path
  );
  let templateLink = `/w2l/${w2lInferenceResult.maybe_w2l_template_token}`;
  let videoDownloadFilename = `vocodes-${w2lInferenceResult.w2l_result_token.replace(
    ":",
    ""
  )}.mp4`;

  MetaTags.setVideoUrl(videoLink);
  MetaTags.setTitle("testing...");

  let durationSeconds = w2lInferenceResult?.duration_millis / 1000;

  let templateName = w2lInferenceResult.template_title;

  let moderatorRows = null;

  if (
    sessionWrapper.canDeleteOtherUsersW2lResults() ||
    sessionWrapper.canDeleteOtherUsersW2lTemplates()
  ) {
    moderatorRows = (
      <>
        <div className="container-panel pt-3 pb-5">
          <div className="panel p-3 p-lg-4">
            <h2 className="panel-title fw-bold">Moderator Details</h2>
            <div className="py-6">
              <table className="table">
                <tbody>
                  <tr>
                    <th>Template creator is banned</th>
                    <td>
                      {w2lInferenceResult?.maybe_moderator_fields
                        ?.template_creator_is_banned
                        ? "banned"
                        : "good standing"}
                    </td>
                  </tr>
                  <tr>
                    <th>Result creator is banned (if user)</th>
                    <td>
                      {w2lInferenceResult?.maybe_moderator_fields
                        ?.result_creator_is_banned_if_user
                        ? "banned"
                        : "good standing"}
                    </td>
                  </tr>
                  <tr>
                    <th>Result creator IP address</th>
                    <td>
                      {w2lInferenceResult?.maybe_moderator_fields
                        ?.result_creator_ip_address || "server error"}
                    </td>
                  </tr>
                  <tr>
                    <th>Mod deleted at (UTC)</th>
                    <td>
                      {w2lInferenceResult?.maybe_moderator_fields
                        ?.mod_deleted_at || "not deleted"}
                    </td>
                  </tr>
                  <tr>
                    <th>Result creator deleted at (UTC)</th>
                    <td>
                      {w2lInferenceResult?.maybe_moderator_fields
                        ?.result_creator_deleted_at || "not deleted"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (w2lInferenceResult.template_title.length < 5) {
    templateName = `Template: ${w2lInferenceResult.template_title}`;
  }

  let creatorDetails = <span>Anonymous user</span>;
  if (!!w2lInferenceResult.maybe_creator_user_token) {
    let creatorLink = `/profile/${w2lInferenceResult.maybe_creator_username}`;
    creatorDetails = (
      <span>
        <Gravatar
          size={15}
          username={w2lInferenceResult.maybe_creator_display_name || ""}
          email_hash={w2lInferenceResult.maybe_creator_gravatar_hash || ""}
        />
        &nbsp;
        <Link to={creatorLink}>
          {w2lInferenceResult.maybe_creator_display_name}
        </Link>
      </span>
    );
  }

  let templateCreatorDetails = <span>Anonymous user</span>;
  if (!!w2lInferenceResult.maybe_template_creator_user_token) {
    let templateCreatorLink = `/profile/${w2lInferenceResult.maybe_template_creator_username}`;
    templateCreatorDetails = (
      <span>
        <Gravatar
          size={15}
          username={
            w2lInferenceResult.maybe_template_creator_display_name || ""
          }
          email_hash={
            w2lInferenceResult.maybe_template_creator_gravatar_hash || ""
          }
        />
        &nbsp;
        <Link to={templateCreatorLink}>
          {w2lInferenceResult.maybe_template_creator_display_name}
        </Link>
      </span>
    );
  }

  let resultVisibility =
    w2lInferenceResult?.creator_set_visibility === "hidden" ? (
      <span>
        Hidden <HiddenIconFc />
      </span>
    ) : (
      <span>
        Public <VisibleIconFc />
      </span>
    );

  const currentlyDeleted =
    !!w2lInferenceResult?.maybe_moderator_fields?.mod_deleted_at ||
    !!w2lInferenceResult?.maybe_moderator_fields?.result_creator_deleted_at;

  const deleteButtonTitle = currentlyDeleted
    ? "Undelete Result?"
    : "Delete Result?";

  const deleteButtonCss = currentlyDeleted
    ? "btn btn-secondary w-100"
    : "btn btn-destructive w-100";

  let editButton = null;
  const canEdit = sessionWrapper.canEditW2lResultAsUserOrMod(
    w2lInferenceResult?.maybe_creator_user_token
  );

  if (canEdit) {
    editButton = (
      <>
        <Link
          className="btn btn-secondary w-100"
          to={WebUrl.w2lResultEditPage(token)}
        >
          <FontAwesomeIcon icon={faEdit} className="me-2" />
          Edit Result Visibility
        </Link>
      </>
    );
  }

  let deleteButton = null;
  const canDelete = sessionWrapper.canDeleteW2lResultAsUserOrMod(
    w2lInferenceResult?.maybe_creator_user_token
  );

  if (canDelete) {
    deleteButton = (
      <>
        <Link
          className={deleteButtonCss}
          to={WebUrl.w2lResultDeletePage(token)}
        >
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          {deleteButtonTitle}
        </Link>
      </>
    );
  }
  return (
    <div>
      <div className="container py-5 px-md-4 px-lg-5 px-xl-3">
        <h1 className=" fw-bold text-center text-lg-start">Lipsync Result</h1>
      </div>

      <div className="container">
        <video width="100%" height="auto" controls={true} className="rounded">
          <source src={videoLink} />
          Your device doesn't support video.
        </video>
      </div>

      <div className="container pt-4 pb-5">
        <a
          className="btn btn-primary w-100"
          href={videoLink}
          download={videoDownloadFilename}
        >
          {" "}
          <FontAwesomeIcon icon={faDownload} className="me-2" />
          Download File
        </a>
      </div>

      <div className="container-panel pt-5 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold">Result Details</h2>
          <div className="py-6">
            <table className="table">
              <tbody>
                <tr>
                  <th>Creator</th>
                  <td>{creatorDetails}</td>
                </tr>
                <tr>
                  <th>Duration</th>
                  <td>{durationSeconds} seconds</td>
                </tr>
                <tr>
                  <th>Visibility</th>
                  <td>{resultVisibility}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="container-panel pt-3 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="panel-title fw-bold"> Template Details </h2>
          <div className="py-6">
            <table className="table">
              <tbody>
                <tr>
                  <th>Template used</th>
                  <td>
                    <Link to={templateLink}>{templateName}</Link>
                  </td>
                </tr>
                <tr>
                  <th>Template creator</th>
                  <td>{templateCreatorDetails}</td>
                </tr>
                <tr>
                  <th>Dimensions</th>
                  <td>
                    {w2lInferenceResult?.frame_width} x{" "}
                    {w2lInferenceResult?.frame_height}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>{moderatorRows}</div>

      <div className="container pb-5">
        <div className="d-flex gap-3 flex-column flex-md-row">
          {editButton}
          {deleteButton}
        </div>
        <div className="mt-4">
          <ReportDiscordLink />
        </div>
      </div>

      <div className="container-panel pt-4 pb-5">
        <div className="panel p-3 p-lg-4">
          <h2 className="fw-bold panel-title">Comments</h2>
          <div className="py-6">
            <CommentComponent
              entityType="user"
              entityToken={w2lInferenceResult.w2l_result_token}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
