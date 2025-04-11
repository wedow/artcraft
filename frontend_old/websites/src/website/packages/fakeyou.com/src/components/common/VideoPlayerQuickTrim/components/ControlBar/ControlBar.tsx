import React from 'react';

import { STATE_STATUSES } from "../../reducer";
import { ButtonPlaypause } from './ButtonPlaypause';
import { ButtonRepeat } from './ButtonRepeat';
import { ButtonMute } from './ButtonMute';
import { LabelTimeDuration } from  "./LabelTimeDuration"
import { SelectTrim } from './SelectTrims';
import { LoadingDots } from '../LoadingDots';
export const ControlBar = ({
  debug: propsDebug = false,
  status
}:{
  debug?:boolean;
  status: string;
})=>{
  const debug = false || propsDebug;
  if (debug) console.log("reRENDERING ------ ControlBar");


  if (status === STATE_STATUSES.VIDEO_METADATA_LOADED){
    return(
      <div className="d-flex w-100 justify-content-between mt-3 flex-wrap">
        <div className="playpause-external d-flex align-items-center flex-wrap mb-2">
          <ButtonPlaypause />
          <ButtonRepeat />
          <ButtonMute />
          <LabelTimeDuration />
        </div>
        <SelectTrim />
      </div>
    );
  }
  return(
    <div className="d-flex w-100 justify-content-center mt-3 flex-wrap">
      <LoadingDots />
    </div>
  );
};

