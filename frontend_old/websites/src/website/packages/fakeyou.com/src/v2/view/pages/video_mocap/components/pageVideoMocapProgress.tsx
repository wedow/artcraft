import React from "react";
import { v4 as uuidv4 } from "uuid";

import { EnqueueVideoMotionCapture } from "@storyteller/components/src/api/video_mocap";

import { states, Action, State } from "../videoMocapReducer";
import { Button, Spinner } from "components/common/";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileCheck,
  faFileUpload,
  faPersonWalkingArrowRight,
} from "@fortawesome/pro-solid-svg-icons";

export default function PageVideoMocapProgress({
  t,
  pageState,
  dispatchPageState,
}: {
  t: Function;
  pageState: State;
  dispatchPageState: (action: Action) => void;
}) {
  const {
    FILE_UPLOADING,
    FILE_UPLOADED,
    FILE_SELECTED_PROCEED,
    MOCAPNET_ENQUEUEING,
  } = states;

  const handleEnqueueMocapNet = () => {
    if (pageState.mediaFileToken) {
      const request = {
        video_source: pageState.mediaFileToken,
        uuid_idempotency_token: uuidv4(),
      };
      EnqueueVideoMotionCapture(request).then(res => {
        if (res.success && res.inference_job_token) {
          dispatchPageState({
            type: "enqueueMocapNetSuccess",
            payload: {
              inferenceJobToken: res.inference_job_token,
            },
          });
        }
      });
      dispatchPageState({ type: "enqueueMocapNet" });
    }
  };

  if (pageState.status === FILE_SELECTED_PROCEED) {
    handleEnqueueMocapNet();
  }

  if (pageState.status === FILE_UPLOADING) {
    return (
      <div className="d-flex flex-column p-4 gap-3 text-center align-items-center">
        <FontAwesomeIcon icon={faFileUpload} className="display-5 mb-2" />
        <h2 className="fw-semibold">{t("tab.message.fileUploading")}</h2>
        <div className="d-flex justify-content-center">
          <Spinner />
        </div>
      </div>
    );
  } else if (pageState.status === FILE_UPLOADED) {
    return (
      <div className="d-flex flex-column p-4 gap-3 text-center align-items-center">
        <FontAwesomeIcon icon={faFileCheck} className="display-5 mb-2" />
        <h2 className="fw-semibold">{t("tab.message.fileUploaded")}</h2>
        <div className="d-flex gap-2">
          {/* Cancel goes back to first page */}
          <Button label="Cancel" onClick={() => {}} variant="secondary" />
          <Button
            label={t("button.generate")}
            onClick={handleEnqueueMocapNet}
            variant="primary"
          />
        </div>
      </div>
    );
  } else if (pageState.status === MOCAPNET_ENQUEUEING) {
    return (
      <div className="d-flex flex-column p-4 gap-3 text-center align-items-center">
        <FontAwesomeIcon
          icon={faPersonWalkingArrowRight}
          className="display-5 mb-2"
        />
        <h2 className="fw-semibold">{t("tab.message.mocapNetRequesting")}</h2>
        <div className="d-flex justify-content-center">
          <Spinner />
        </div>
      </div>
    );
  }
  return (
    <div className="d-flex flex-column p-4 gap-3 text-center align-items-center">
      <div className="d-flex justify-content-center">
        <h2 className="fw-semibold">{t("message.UnknownError")}</h2>
      </div>
    </div>
  );
}
