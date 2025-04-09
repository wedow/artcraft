import React, {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  faPlay,
  faPause,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useLocalize } from "hooks";
import Spinner from "components/common/Spinner";
import { STATE_STATUSES } from "../reducer";
import { VideoElementContext } from "../contexts";

export function VideoTakeover({
  status,
  height
}:{
  status: string;
  height:number;
}){
  const { t } = useLocalize("vidEl");
  const vidEl = useContext(VideoElementContext);
  const [playpause, setPlaypause] = useState<"playing"|"paused">("paused");
  const togglePlaypause = ()=>{
    if (playpause === "playing") vidEl?.pause();
    else vidEl?.play();
  }

  useEffect(()=>{
    const setPlaying = ()=>setPlaypause("playing");
    const setPaused = ()=>setPlaypause("paused");
    if(vidEl!==null){
      vidEl.addEventListener("play", setPlaying );
      vidEl.addEventListener("pause", setPaused);
    }
    return()=>{
      if(vidEl!==null){
        vidEl.removeEventListener("play", setPlaying);
        vidEl.removeEventListener("pause", setPaused);
      }
    };
  },[vidEl]);


  if(status === STATE_STATUSES.INIT){
    return(
      <div className="video-takeover">
        <div className="video-takeover-inner loading">
          <Spinner size={height/5}/>
        </div>
      </div>
    );
  }else if(status === STATE_STATUSES.ERROR_VIDEO_TOO_SHORT){
    return(
      <div className="video-takeover">
        <div className="video-takeover-inner">
          <h1>{t('error.videoTooShort')}</h1>
        </div>
      </div>
    );
  }else if(status === STATE_STATUSES.VIDEO_METADATA_LOADED){
    return(
      <div className="playpause-overlay" onClick={togglePlaypause}>
        {playpause === "playing" && (
          <FontAwesomeIcon
            className="playpause-icon"
            icon={faPause}
            size="8x"
          />
        )}
        {playpause === "paused" && (
          <FontAwesomeIcon
            className="playpause-icon"
            icon={faPlay}
            size="8x"
          />
        )}
      </div>
    );
  }
  return null; //no take overs
}