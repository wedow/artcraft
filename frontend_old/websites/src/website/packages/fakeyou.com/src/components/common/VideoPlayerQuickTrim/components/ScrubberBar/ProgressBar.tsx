import React, {
  useContext,
  useEffect,
  useState,
} from 'react';

import { VideoElementContext } from '../../contexts';

export const ProgressBar = ()=>{
  // console.log("reRENDERING -------- ScrubberBar");

  const vidEl = useContext(VideoElementContext);
  const [buffered, setBuffered] = useState<number>(0);
  const [portionPlayed, setPortionPlayed] = useState<number>(0);

  useEffect(()=>{
    function handleBuffer(){
      if(vidEl && vidEl.buffered.length > 0){
        const bufferEnd = vidEl.buffered.end(vidEl.buffered.length-1);
        const allLoaded = (bufferEnd === vidEl.duration);
        // console.log(`end:${bufferEnd} === ${vidEl.duration} = ${allLoaded}`);
        if(allLoaded) vidEl.removeEventListener("timeupdate", handleBuffer);
        setBuffered((curr)=>{
          if(curr!==bufferEnd) return bufferEnd;
          else return curr
        });
      }
    }
    function handlePortionPlayed(){
      if(vidEl){
        setPortionPlayed(vidEl.currentTime / vidEl.duration * 100);
      }
    }

    vidEl?.addEventListener("timeupdate", handleBuffer);
    vidEl?.addEventListener("timeupdate", handlePortionPlayed);
    setTimeout(handleBuffer, 500); // delaying for first load;
    return ()=>{
      vidEl?.removeEventListener("timeupdate", handleBuffer);
      vidEl?.removeEventListener("timeupdate", handlePortionPlayed);
    };
  },[vidEl]);

  if(vidEl){
    return(
      <div className="progress-bar player-border-bottom">
        <span className="loaded" style={{width: (buffered / vidEl.duration* 100) + "%"}} />
        <span className="played" style={{width: portionPlayed + "%"}} />
      </div>
    );
  }
  else return null;
}

