import React, { useCallback, useEffect, useState } from "react";
import {
  faBarsStaggered,
  faCircleExclamation,
  faDeleteLeft,
  faEdit,
  faMemoCircleInfo,
  faMessages,
  faTrash,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Panel from "components/common/Panel/Panel";
import { Link } from "react-router-dom";
import PageHeader from "components/layout/PageHeader";
import { CommentComponent } from "v2/view/_common/comments/CommentComponent";
import Container from "components/common/Container/Container";
import TextArea from "components/common/TextArea";
import { Button } from "components/common";
import { SessionVoiceDesignerInferenceResultsList } from "v2/view/_common/SessionVoiceDesignerInferenceResultsList";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";
import { GetVoice } from "@storyteller/components/src/api/voice_designer/voices/GetVoice";
import Skeleton from "components/common/Skeleton";
import useVoiceRequests from "./useVoiceRequests";
import { v4 as uuidv4 } from "uuid";
import { useHistory } from "react-router-dom";
import { useInferenceJobs, useSession } from "hooks";

export default function VoiceDesignerUseVoicePage() {
  const { sessionWrapper } = useSession();
  const { voice_token } = useParams<{ voice_token: string }>();
  const [textBuffer, setTextBuffer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [voiceData, setVoiceData] = useState({
    title: "",
    creatorUsername: "",
    createdAt: "",
    updatedAt: "",
    visibility: "",
    voiceToken: "",
    languageTag: "",
  });
  const { inference } = useVoiceRequests({});
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const history = useHistory();
  const { enqueueInferenceJob } = useInferenceJobs();

  const getVoiceDetails = useCallback(async voice_token => {
    try {
      let result = await GetVoice(voice_token, {});

      if (result) {
        setVoiceData({
          title: result.title,
          creatorUsername: result.creator.username,
          createdAt: result.created_at.toString(),
          updatedAt: result.updated_at.toString(),
          visibility: result.creator_set_visibility,
          voiceToken: result.voice_token,
          languageTag: result.ietf_language_tag,
        });
        setIsLoading(false);
      } else {
        setError(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching voice details:", error);
      setError(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getVoiceDetails(voice_token);
  }, [voice_token, getVoiceDetails]);

  const modelCreatorLink = (
    <Link to={`/profile/${voiceData.creatorUsername}`}>
      {voiceData.creatorUsername}
    </Link>
  );

  const subText = <div>TTS model by {modelCreatorLink}</div>;

  const voiceDetails = [
    { label: "Creator", value: modelCreatorLink },
    { label: "Title", value: voiceData.title },
    { label: "Spoken language", value: voiceData.languageTag },
    { label: "Created at (UTC)", value: voiceData.createdAt },
    { label: "Updated at (UTC)", value: voiceData.updatedAt },
    { label: "Visibility", value: voiceData.visibility },
  ];

  // const voiceDetailsModerator = [
  //   { label: "Creator is banned?", value: modelCreatorBanned },
  //   { label: "Creation IP address", value: modelCreationIp },
  //   { label: "Update IP address", value: modelUpdateIp },
  //   { label: "Mod deleted at (UTC)", value: moderatorDeletedAt },
  //   { label: "User deleted at (UTC)", value: userDeletedAt },
  //   { label: "Front page featured?", value: frontPageFeatured },
  // ];

  const handleEnqueueTts = () => {
    setIsEnqueuing(true);
    inference
      .enqueue("", {
        uuid_idempotency_token: uuidv4(),
        text: textBuffer,
        voice_token: voice_token,
      })
      .then((res: any) => {
        if (res && res.success) {
          enqueueInferenceJob(
            res.inference_job_token,
            FrontendInferenceJobType.VoiceDesignerTts
          );
        }
      })
      .catch(error => {
        console.error("Error enqueuing TTS:", error);
      })
      .finally(() => {
        setIsEnqueuing(false);
      });
  };

  const handleChangeText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const textValue = (ev.target as HTMLTextAreaElement).value;
    setTextBuffer(textValue);
  };

  const handleClearText = () => {
    setTextBuffer("");
  };

  if (isLoading) {
    return (
      <Container type="panel">
        <Panel padding={true} clear={true}>
          <h1>
            <Skeleton />
          </h1>
          <p>
            <Skeleton />
          </p>
        </Panel>

        <Panel padding={true}>
          <Skeleton />
        </Panel>
      </Container>
    );
  }

  if (error) {
    return (
      <Container type="panel">
        <PageHeader
          panel={true}
          titleIcon={faCircleExclamation}
          title="Voice model not found"
          subText="This voice does not exist or is private."
          extension={
            <div className="d-flex">
              <Button label="Back to homepage" to="/" className="d-flex" />
            </div>
          }
        />
      </Container>
    );
  }

  if (!sessionWrapper.isLoggedIn()) {
    history.push("/voice-designer");
  }

  return (
    <Container type="panel">
      <PageHeader title={voiceData.title} subText={subText} />

      <Panel padding={true} mb={true}>
        <form>
          <div className="row g-4">
            <div className="col-12 col-lg-6 d-flex flex-column gap-3">
              <h4>
                <FontAwesomeIcon icon={faWaveformLines} className="me-3" />
                Use Voice
              </h4>
              <TextArea
                placeholder="Enter text you want your character to say here..."
                value={textBuffer}
                onChange={handleChangeText}
                rows={8}
              />
              <div className="d-flex gap-3">
                <Button
                  icon={faVolumeUp}
                  label="Speak"
                  full={true}
                  onClick={handleEnqueueTts}
                  isLoading={isEnqueuing}
                />
                <Button
                  icon={faDeleteLeft}
                  label="Clear"
                  full={true}
                  variant="danger"
                  onClick={handleClearText}
                />
              </div>
            </div>
            <div className="col-12 col-lg-6 d-flex flex-column gap-3">
              <h4>
                <FontAwesomeIcon icon={faBarsStaggered} className="me-3" />
                Session TTS Results
              </h4>
              <div className="d-flex flex-column gap-3 session-tts-section">
                <SessionVoiceDesignerInferenceResultsList />
              </div>
            </div>
          </div>
        </form>
      </Panel>

      {/* {modelDescription && (
        <Panel padding mb>
          <h4 className="mb-4">
            <FontAwesomeIcon icon={faMemo} className="me-3" />
            Description
          </h4>
          <p>{modelDescription}</p>
        </Panel>
      )} */}

      <Panel padding mb>
        <h4 className="mb-4">
          <FontAwesomeIcon icon={faMemoCircleInfo} className="me-3" />
          Voice Details
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
            {/* {sessionWrapper.canBanUsers() &&
              voiceDetailsModerator.map((item, index) => (
                <tr key={index}>
                  <th scope="row" className="fw-semibold">
                    {item.label}
                  </th>
                  <td>{item.value}</td>
                </tr>
              ))} */}
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

      <Panel padding className="mb-5">
        <h4 className="mb-4">
          <FontAwesomeIcon icon={faMessages} className="me-3" />
          Comments
        </h4>
        <CommentComponent entityType="user" entityToken={voice_token} />
      </Panel>
    </Container>
  );
}
