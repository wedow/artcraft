import React from "react";
import {
  faEdit,
  faEye,
  faMemo,
  faMemoCircleInfo,
  faMessages,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Panel from "components/common/Panel/Panel";
import { Link } from "react-router-dom";
import PageHeaderModelView from "components/layout/PageHeaderModelView/PageHeaderModelView";
import { CommentComponent } from "v2/view/_common/comments/CommentComponent";
import { RatingButtons } from "v2/view/_common/ratings/RatingButtons";
import { RatingStats } from "v2/view/_common/ratings/RatingStats";
import ShareButton from "components/common/ShareButton/ShareButton";
import Container from "components/common/Container/Container";
import VcGenerateAudioPanel from "../VcGenerateAudioPanel";
import { useSession } from "hooks";

export default function VcModelViewPage() {
  const { sessionWrapper } = useSession();
  // let { token } = useParams() as { token: string };

  const title = "Solid Snake";
  const subText = (
    <div className="d-flex align-items-center gap-2">
      <div>
        <span className="badge-model badge-model-rvc fs-6">RVCv2</span>
      </div>
      <p>
        V2V model by <Link to="/">Vegito1089</Link>
      </p>
    </div>
  );
  const tags = ["Speaking", "English", "Character", "Singing", "Spanish"];

  let modelCreatorLink = <Link to="">Creator Name</Link>;
  let modelTitle = title;
  let modelDescription = "This is a description of the model";
  let modelUseCount = 10000;
  let modelLanguage = "English";
  let modelType = "RVCv2";
  let modelUploadDate = "2021-09-10T06:15:04Z";
  let modelVisibility = (
    <div>
      <FontAwesomeIcon icon={faEye} className="me-2" />
      Public
    </div>
  );
  let modelCreatorBanned = "good standing";
  let modelCreationIp = "0.0.0.0.0";
  let modelUpdateIp = "0.0.0.0.0";
  let frontPageFeatured = "no";
  let moderatorDeletedAt = "not deleted";
  let userDeletedAt = "not deleted";

  const voiceDetails = [
    { label: "Creator", value: modelCreatorLink },
    { label: "Title", value: modelTitle },
    { label: "Use count", value: modelUseCount },
    { label: "Spoken language", value: modelLanguage },
    { label: "Model type", value: modelType },
    { label: "Upload date (UTC)", value: modelUploadDate },
    { label: "Visibility", value: modelVisibility },
  ];

  const voiceDetailsModerator = [
    { label: "Creator is banned?", value: modelCreatorBanned },
    { label: "Creation IP address", value: modelCreationIp },
    { label: "Update IP address", value: modelUpdateIp },
    { label: "Mod deleted at (UTC)", value: moderatorDeletedAt },
    { label: "User deleted at (UTC)", value: userDeletedAt },
    { label: "Front page featured?", value: frontPageFeatured },
  ];

  let ratingButtons = <></>;
  if (sessionWrapper.isLoggedIn()) {
    ratingButtons = (
      <RatingButtons entity_type="v2v_model" entity_token="test" />
    );
  }

  let ratingStats = (
    <RatingStats positive_votes={100} negative_votes={0} total_votes={100} />
  );

  const shareUrl = window.location.href;
  const shareButton = <ShareButton url={shareUrl} />;

  return (
    <Container type="full">
      <PageHeaderModelView
        title={title}
        subText={subText}
        tags={tags}
        ratingBtn={ratingButtons}
        ratingStats={ratingStats}
        extras={shareButton}
      />

      <VcGenerateAudioPanel
        setVoiceConversionModels={() => {}}
        voiceConversionModels={[]}
        setMaybeSelectedVoiceConversionModel={() => {}}
      />

      {modelDescription && (
        <Panel padding mb>
          <h4 className="mb-4">
            <FontAwesomeIcon icon={faMemo} className="me-3" />
            Description
          </h4>
          <p>{modelDescription}</p>
        </Panel>
      )}

      <Panel padding mb>
        <h4 className="mb-4">
          <FontAwesomeIcon icon={faMemoCircleInfo} className="me-3" />
          Voice Model Details
        </h4>
        <table className="table">
          <tbody>
            {voiceDetails.map((item, index) => (
              <tr key={index}>
                <th scope="row" className="fw-semibold">
                  {item.label}
                </th>
                <td>{item.value}</td>
              </tr>
            ))}
            {sessionWrapper.canBanUsers() &&
              voiceDetailsModerator.map((item, index) => (
                <tr key={index}>
                  <th scope="row" className="fw-semibold">
                    {item.label}
                  </th>
                  <td>{item.value}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {sessionWrapper.canBanUsers() && (
          <div className="d-flex flex-column flex-md-row gap-3 mt-5">
            <Link className={"btn btn-secondary w-100"} to="">
              <FontAwesomeIcon icon={faEdit} className="me-2" />
              Edit Model Details
            </Link>
            <Link className="btn btn-destructive w-100" to="">
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Delete Model
            </Link>
          </div>
        )}
      </Panel>

      <Panel padding>
        <h4 className="mb-4">
          <FontAwesomeIcon icon={faMessages} className="me-3" />
          Comments
        </h4>
        <CommentComponent entityType="user" entityToken="test" />
      </Panel>
    </Container>
  );
}
