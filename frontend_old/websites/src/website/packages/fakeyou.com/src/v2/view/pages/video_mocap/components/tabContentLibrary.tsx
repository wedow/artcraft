import React from "react";

import SelectModal, {SelectModalData} from "components/common/SelectModal/SelectModal";
import { Action, State } from "../videoMocapReducer";
import { Button } from "components/common";
import VideoFakeyou from "components/common/VideoFakeyou";


export default function TabContentLibrary({
  t,
  pageState,
  dispatchPageState,
}: {
  t: Function;
  pageState: State;
  dispatchPageState: (action: Action) => void;
}) {

  const handleProceed = () => {
      dispatchPageState({ type: "proceedSelectedFile" });
  };
  const handleOnSelect = (data:SelectModalData) => {
    if (data.token !==""){
      dispatchPageState({
        type: "selectedFile",
        payload: { mediaFileToken: data.token },
      });
    }else{
      dispatchPageState({type: "clearedFile"});
    }
  };

  return (
    <div className="row g-3">
      <div className="col-12">
        <SelectModal
          modalTitle="Select a Video"
          label="Select a Video"
          onSelect={handleOnSelect}
          value={{token: pageState.mediaFileToken || "", title: ""}}
          tabs={[
            {
              label: "All Videos",
              tabKey: "allVideos",
              typeFilter: "video",
              searcher: false,
              type: "media",
            },
          ]}
        />
        {pageState.mediaFileToken && 
          <VideoFakeyou mediaToken={pageState.mediaFileToken} />
        }
      </div>
      {pageState.mediaFileToken && 
        <div className="col-12 d-flex justify-content-center mt-5">
          <Button label={t("button.proceed")} onClick={handleProceed} />
        </div>
      }
    </div>
  );
}
