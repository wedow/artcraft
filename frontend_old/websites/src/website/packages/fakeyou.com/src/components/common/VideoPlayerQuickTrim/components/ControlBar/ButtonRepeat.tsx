import React, {
  useContext,
  useEffect,
  useState
} from "react";

import {
  faArrowsRepeat
} from "@fortawesome/pro-solid-svg-icons";

import { Button } from "components/common";
import { ONE_MS } from "../../utilities";
import { 
  VideoElementContext,
  TrimContext
} from '../../contexts';


export function ButtonRepeat (){
  const vidEl = useContext(VideoElementContext);
  const trimVals = useContext(TrimContext);
  const [isRepeatOn, setIsRepeat] = useState<boolean>(true);

  const toggleRepeat = ()=>{
    setIsRepeat((curr)=>(!curr));
  }

  useEffect(()=>{
    function handleRepeat(){
      if(isRepeatOn && vidEl !==null && trimVals!==null){
        const currentMs = Math.round(vidEl.currentTime * 1000)
        if(currentMs > trimVals.trimEndMs
          || currentMs < trimVals.trimStartMs
        ){
          vidEl.currentTime = trimVals.trimStartMs/1000 + ONE_MS
        }
      }
    }
    vidEl?.addEventListener("timeupdate", handleRepeat);
    return ()=>{
      vidEl?.removeEventListener("timeupdate", handleRepeat);
    };
  },[isRepeatOn, vidEl, trimVals]);

  return(
    <Button
      className="button-repeat"
      icon={ faArrowsRepeat }
      variant={ isRepeatOn ? "primary":"secondary"}
      onClick={toggleRepeat}
    />
  )
}