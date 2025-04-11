import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from 'react';

import { VideoElementContext } from '../../contexts';
import { withScrubbing, withScrubbingPropsI } from './withScrubbing';

interface TimeCursorPropsI {
  debug?: boolean
}

export const TimeCursor = ({
  debug: propsDebug = false,
  ...rest
}:TimeCursorPropsI)=>{
  const debug = false || propsDebug;
  if (debug) console.log("reRENDERING ----- Time Cursor");

  const videoElement = useContext(VideoElementContext);
  const [timeCursorOffset, setTimeCursorOffset] = useState(0);
  const [boundingWidth, setBoundingWidth] = useState(videoElement?.getBoundingClientRect().width || 0);
  const isLockedForScrubbing = useRef<boolean>(false);
  const wasPlaying = useRef<boolean>(false);

  const PlayCursorWithScrubbing = withScrubbing<withScrubbingPropsI>(()=>{
    return(
      <div className="playcursor" />
    );
  });
  useEffect(()=>{
    const handleTimeCursorPosition = ()=>{
      if(videoElement!==null && !isLockedForScrubbing.current){
        const newOffset = (videoElement.currentTime / videoElement.duration) * (boundingWidth);
        
        setTimeCursorOffset(newOffset);
      }
    };
    videoElement?.addEventListener("timeupdate", handleTimeCursorPosition);
    return()=>{
      videoElement?.removeEventListener("timeupdate",handleTimeCursorPosition);
    }
  },[videoElement, boundingWidth]);

  const handleWindowResize = useCallback(()=> {
    if (videoElement !== null){
      console.log("BOUNDING WIDTH IS " + videoElement.getBoundingClientRect().width);
      setBoundingWidth(videoElement.getBoundingClientRect().width)
    }
  },[videoElement]);

  useLayoutEffect(()=>{
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleWindowResize])

  const handleOnScrubStart = useCallback(() => {
    isLockedForScrubbing.current = true;
    if(videoElement!==null) {
      if (videoElement.paused) wasPlaying.current = false;
      else {
        wasPlaying.current = true;
        videoElement.pause();
      }
    }
  }, [videoElement])

  const handleOnScrubEnd = useCallback( (newPos: number)=>{
    isLockedForScrubbing.current = false;
    if(videoElement !== null){
      const newTime = newPos / boundingWidth * videoElement.duration;
      videoElement.currentTime = newTime;
      if(wasPlaying.current === true){
        videoElement.play();
      }
    }
  },[videoElement, boundingWidth]);
  
  return(
    <PlayCursorWithScrubbing
      boundingWidth={boundingWidth}
      hitboxPadding={16}
      scrubberWidth={8}
      onScrubStart={handleOnScrubStart}
      onScrubEnd={handleOnScrubEnd}
      scrubPosition={timeCursorOffset}
      {...rest}
    />
  );
};
