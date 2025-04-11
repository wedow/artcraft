import React, {
  useContext,
  useEffect,
  useState
} from "react";

import {
  faVolumeSlash,
  faVolume
} from "@fortawesome/pro-solid-svg-icons";

import { Button } from "components/common";
import { VideoElementContext } from '../../contexts';

export function ButtonMute (){
  const vidEl = useContext(VideoElementContext);
  const [isMuted, setIsMuted] = useState<boolean>(vidEl?.muted || false);

  const toggleMute = ()=>{
    setIsMuted((curr)=>(!curr));
  }

  useEffect(()=>{
    if(vidEl !==null){
      if (isMuted) vidEl.muted = true;
      else vidEl.muted = false;
    }
  },[isMuted, vidEl]);

  return(
    <Button
      className="button-mute"
      icon={ isMuted ? faVolumeSlash : faVolume}
      variant="secondary"
      onClick={toggleMute}
    />
  )
}