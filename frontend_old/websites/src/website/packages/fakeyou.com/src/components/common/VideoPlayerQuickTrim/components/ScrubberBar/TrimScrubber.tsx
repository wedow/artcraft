import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from 'react';
import {
  faGripDots
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { withScrubbing, withScrubbingPropsI } from 'components/highorder/withScrubbing';
import { 
  VideoElementContext,
  TrimContext,
} from '../../contexts';


interface TrimScrubberPropsI {
  debug?: boolean
}
export const TrimScrubber = ({
  debug: propsDebug = false,
  ...rest
}:TrimScrubberPropsI)=>{
  const debug = false || propsDebug;
  if (debug) console.log("reRENDERING ----- Trim Scrubber");

  const videoElement = useContext(VideoElementContext);
  const trimValues = useContext(TrimContext);

  const calcScrubberWidth = useCallback(()=>{
    if (videoElement!==null && trimValues !==null){
      const bound = videoElement.getBoundingClientRect().width;
      return Math.round(
        trimValues.trimDurationMs / (videoElement.duration * 1000) * bound
      );
    }
    return 0
  }, [videoElement, trimValues]);
  const [scrubberWidth, setScrubberWidth] = useState<number>(calcScrubberWidth());
  useEffect(()=>{
    if (trimValues !== null){
      const newWidth = calcScrubberWidth();
      setScrubberWidth((currWidth)=>{
        if (newWidth !== currWidth) return newWidth;
        else return currWidth;
      });
    }
  },[trimValues, calcScrubberWidth]);



  const handleWindowResize = useCallback(()=> {
      setScrubberWidth(calcScrubberWidth());
  },[calcScrubberWidth]);

  useLayoutEffect(()=>{
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleWindowResize])

  const TrimScrubberWithScrubbing = withScrubbing<withScrubbingPropsI>(() => {
    return(
      <div className="trim-scrubber">
        <FontAwesomeIcon icon={faGripDots} />
      </div>
    );
  });


  const calcScrubberPosition = useCallback(()=>{
    if (videoElement !== null && trimValues !== null){
      return (trimValues.trimStartMs / (videoElement.duration * 1000) * videoElement.getBoundingClientRect().width);
    }
    return 0;
  }, [videoElement, trimValues]);
  const scrubberPosition = useRef(calcScrubberPosition());
  const handleOnScrubEnd = useCallback((newPos: number)=>{
    scrubberPosition.current = newPos;

    if(videoElement !== null && trimValues !== null){
      const boundingWidth = videoElement.getBoundingClientRect().width
      const newStartTime = Math.round(newPos / boundingWidth * videoElement.duration * 1000);
      if(trimValues.trimStartMs !== newStartTime){
        trimValues.onChange({
          trimStartMs: newStartTime,
          trimEndMs: newStartTime + trimValues.trimDurationMs,
        });
      }
    }
  }, [videoElement, trimValues])

  return (
    <TrimScrubberWithScrubbing
      debug={debug}
      boundingWidth={videoElement?.getBoundingClientRect().width || 0}
      scrubberWidth={scrubberWidth}
      styleOverride={{
        top: '-1rem',
      }}
      scrubPosition={scrubberPosition.current}
      onScrubEnd={handleOnScrubEnd}
      {...rest}
    />
  );
};
