import React, {
  useContext,
  useEffect,
  useState
} from "react";

import { formatSecondsToHHMMSSCS } from "../../utilities";
import { VideoElementContext } from '../../contexts';

export function LabelTimeDuration(){
  const vidEl = useContext(VideoElementContext);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(vidEl?.duration || 0);
  //vidEl context is guarunteed to exist via the load order

  useEffect(()=>{
    const handleTimeStamp = ()=>setCurrentTime(vidEl?.currentTime ||0);
    const handleDuration = ()=>setDuration(vidEl?.duration ||0);
    vidEl?.addEventListener("timeupdate", handleTimeStamp);
    vidEl?.addEventListener("durationchange", handleDuration);
    return()=>{
      vidEl?.removeEventListener("timeupdate",handleTimeStamp);
      vidEl?.addEventListener("durationchange", handleDuration);
    }
  },[vidEl]);
  
  return(
    <div className="playtime d-flex">
      <span>
        <p>
          {`${formatSecondsToHHMMSSCS(currentTime)}`}
        </p>
      </span>
      <div>/</div>
      <span>
        <p>
          {`${formatSecondsToHHMMSSCS(duration)}`}
        </p>
      </span>
    </div>
  );
}