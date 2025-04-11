import React, {
  useContext,
  useEffect,
  useState
} from "react";

import {
  faPlay,
  faPause,
} from "@fortawesome/pro-solid-svg-icons";

import { Button } from "components/common";
import {VideoElementContext} from '../../contexts';

export function ButtonPlaypause (){
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

  return(
    <Button
      className="button-playpause"
      icon={ playpause === "playing" ? faPause : faPlay }
      variant="secondary"
      onClick={togglePlaypause}
    />
  )
}