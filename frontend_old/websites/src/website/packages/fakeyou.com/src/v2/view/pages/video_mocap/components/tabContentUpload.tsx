import React from "react";
import { v4 as uuidv4 } from "uuid";

import { UploadMedia } from "@storyteller/components/src/api/media_files/UploadMedia";
import { useFile } from "hooks";

import VideoInput from "components/common/VideoInput";
import { states, Action, State } from "../videoMocapReducer";

export default function TabContentUpload({t, pageState, dispatchPageState}: {
  t: Function;
  pageState: State;
  dispatchPageState: (action: Action) => void;
}) {
  const videoProps = useFile({});
  const {NO_FILE, FILE_STAGED, FILE_UPLOADING} = states;


  const makeVideoUploadRequest = () => ({
    uuid_idempotency_token: uuidv4(),
    file: videoProps.file,
    source: "file",
    type: "video",
  });

  const handleUploadVideo = () => {
    dispatchPageState({type: 'uploadFile'});
    UploadMedia(makeVideoUploadRequest()).then(res => {
      if (res.success && res.media_file_token) {
        dispatchPageState({
          type: 'uploadFileSuccess', 
          payload:{
            mediaFileToken :res.media_file_token
          }
        })
      }
    });
  };

  // contains upload inout state and controls, see docs
  if (pageState.status < FILE_UPLOADING) {
    return (
      <>
        <div className="row">
          <div className="col-12">
            <VideoInput
              {...{
                t,
                ...videoProps,
                onStateChange: () =>{
                  if (pageState.status === NO_FILE && videoProps.file)
                    dispatchPageState({type: "stagedFile"})
                  else if (pageState.status === FILE_STAGED && !videoProps.file)
                    dispatchPageState({type: "clearedFile"})
                }
              }}
            />
          </div>
        </div>

        <div className="row py-3">
          <div className="col-12">
            <div className="d-flex justify-content-end gap-3">
              <button
                className="btn btn-primary"
                disabled={pageState.status !== FILE_STAGED}
                onClick={handleUploadVideo}
              >
                {t("button.upload")}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  return (
      <div className="row">
        <div className="col-12">
          <h1>{t("message.UnknownError")}</h1>
        </div>
      </div>
  );
}
