import React, { useState } from "react";
import { SessionTtsModelUploadResultList } from "../../_common/SessionTtsModelUploadResultsList";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { v4 as uuidv4 } from "uuid";
import { BackLink } from "../../_common/BackLink";
import { Link } from "react-router-dom";
import { WebUrl } from "../../../../common/WebUrl";
import { useInferenceJobs, useSession } from "hooks";

import { EnqueueGsvModelDownload } from "@storyteller/components/src/api/model_downloads/EnqueueGsvModelDownload";
import { Button, Container, Input, Label, Panel } from "components/common";
import {
  faArrowRight,
  faCheckCircle,
  faUpload,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function UploadNewTtsModelPage() {
  // const history = useHistory();
  const { sessionWrapper, user } = useSession();
  const { enqueueInferenceJob } = useInferenceJobs();

  const [downloadUrl, setDownloadUrl] = useState("");
  const [title, setTitle] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  // Form errors
  const [downloadUrlInvalidReason] = useState("");
  const [titleInvalidReason] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  if (!sessionWrapper.isLoggedIn()) {
    return (
      <div className="container py-5">
        <div className="py-5">
          <h1 className="fw-semibold text-center mb-4">
            You need to create an account or log in.
          </h1>
          <div className="d-flex gap-3 justify-content-center">
            <Link className="btn btn-secondary" to="/login">
              Login
            </Link>
            <Link className="btn btn-primary" to="/signup">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadUrlChange = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.preventDefault();
    const downloadUrlValue = (ev.target as HTMLInputElement).value;
    setDownloadUrl(downloadUrlValue);
    setAlertTitle("");
    setShowAlert(false);
    return false;
  };

  const handleTitleChange = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.preventDefault();
    const titleValue = (ev.target as HTMLInputElement).value;
    setTitle(titleValue);
    setAlertTitle("");
    setShowAlert(false);
    return false;
  };

  const handleFormSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    setIsUploading(true);

    await EnqueueGsvModelDownload("", {
      uuid_idempotency_token: uuidv4(),
      download_url: downloadUrl,
      maybe_title: title,
      //maybe_description?: string;
      //maybe_cover_image_media_file_token?:	string;
      //creator_set_visibility?:	string;
    }).then((res: any) => {
      if (res && res.success) {
        enqueueInferenceJob(res.job_token, FrontendInferenceJobType.Unknown);
        setIsUploading(false);
        setAlertTitle(title);
        setShowAlert(true);
        setDownloadUrl("");
        setTitle("");
      }
    });

    return false;
  };

  return (
    <Container type="panel" className="mt-5">
      <Panel clear={true}>
        <div className="d-flex flex-column">
          <h1 className=" fw-bold">Upload New TTS Model</h1>
          <div className="my-3">
            <BackLink
              link={WebUrl.contributePage()}
              text="Back to contribute page"
            />
          </div>
        </div>
      </Panel>

      <Panel padding={true}>
        <form onSubmit={handleFormSubmit}>
          <div className="d-flex flex-column gap-4 mb-4">
            {/* Title */}
            <div>
              <Label label='Title, eg. "Goku (Sean Schemmel)"' />
              <Input
                type="text"
                placeholder="Title"
                value={title}
                onChange={handleTitleChange}
              />
              <p className="help">{titleInvalidReason}</p>
            </div>

            {/* Download URL */}
            <div>
              <Label label="Download URL, eg. Google Drive link" />
              <Input
                type="text"
                placeholder="Download URL"
                value={downloadUrl}
                onChange={handleDownloadUrlChange}
              />
              {downloadUrlInvalidReason && (
                <p className="help">{downloadUrlInvalidReason}</p>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-end align-items-center w-100 gap-4 flex-wrap">
            {showAlert && (
              <div className="alert alert-success alert-dismissible fade show flex-grow-1 mb-0">
                <button
                  type="button"
                  className="btn-close p-3 fs-7"
                  data-bs-dismiss="alert"
                  aria-label="Close"
                  onClick={() => setShowAlert(false)}
                />
                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                Voice model <span className="fw-bold">'{alertTitle}'</span>{" "}
                upload enqueued successfully! It should appear on your profile
                in a minute or two if your download link is valid.{" "}
                <Link
                  to={`/profile/${user.display_name}/weights`}
                  className="fw-semibold"
                >
                  Go to your profile <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            )}

            <Button
              disabled={title === "" || !downloadUrl}
              label="Upload Model"
              icon={faUpload}
              type="submit"
              isLoading={isUploading}
            />
          </div>
        </form>
      </Panel>

      <div className="mt-5">
        <SessionTtsModelUploadResultList />
      </div>
    </Container>
  );
}
