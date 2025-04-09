import React from "react";

import { ProgressBar } from "./ProgressBar";
import { TimeCursor } from './TimeCursor';
import { LoadingDots } from "../LoadingDots";

import { STATE_STATUSES } from "../../reducer";

export const ScrubberBar = ({
  debug: propsDebug = false,
  status,
}:{
  debug?: boolean;
  status: string;
})=>{
  const debug = false || propsDebug;
  if (debug) console.log("reRENDERING ------ ScrubberBar");

  if (status === STATE_STATUSES.VIDEO_METADATA_LOADED){
    return(
      <div className="scrubber-bar">
        <ProgressBar />
        <TimeCursor />
      </div>
    );
  }
  return(
    <div className="scrubber-bar player-border-bottom d-flex justify-content-center align-items-center">
      <LoadingDots />
    </div>
  );
};