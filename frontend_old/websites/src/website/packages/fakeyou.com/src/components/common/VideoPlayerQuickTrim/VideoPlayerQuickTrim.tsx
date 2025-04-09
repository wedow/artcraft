import React, {
  useRef,
  useCallback,
  useReducer,
} from "react";

import { VideoFakeyou } from "components/common";
import { VideoFakeyouProps } from "../VideoFakeyou/VideoFakeyou";

import {
  reducer,
  initialState,
  ACTION_TYPES
} from "./reducer";
import {
  VideoElementContext,
  TrimContext
} from "./contexts";

import { VideoTakeover } from "./components/VideoTakeover";
import { ScrubberBar } from "./components/ScrubberBar";
import { ControlBar } from "./components/ControlBar";

import './styles.scss';


interface Props extends VideoFakeyouProps {
  debug?: boolean;
  height?: number;
  trimStartMs?: number;
  trimEndMs?: number;
  onSelectTrim: ({
    trimStartMs,trimEndMs,
  }:{
    trimStartMs: number,
    trimEndMs:number,
  })=>void
}

export const VideoPlayerQuickTrim = ({
  debug: propsDebug = false,
  height=500,
  trimStartMs,
  trimEndMs,
  onSelectTrim,
  ...rest
}: Props) => {
  const debug = true || propsDebug;
  if(debug) console.log(`reRENDER VP_QuickTrim start@${trimStartMs} end@${trimEndMs}`)

  const [compState, dispatchCompState] = useReducer(reducer, initialState);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoRefCallback = useCallback(node => {
    function handleLoadedmetadata (){
      dispatchCompState({
        type: ACTION_TYPES.ON_LOADED_METADATA,
        payload:{ videoDuration: node.duration,}
      });
    };
    if (node !== null) {
      // DOM node referenced by ref has changed and exists
      videoRef.current = node;
      node.addEventListener("loadedmetadata", handleLoadedmetadata);
    } // else{} DOM node referenced by ref has been unmounted

    return()=>{
        node?.removeEventListener("loadedmetadata",handleLoadedmetadata);
    }

  }, [
    // No Dependency !
  ]); //END videoRefCallback\

  return(
    <VideoElementContext.Provider value={videoRef.current}>
      <TrimContext.Provider value={{
        trimStartMs: trimStartMs || 0,
        trimEndMs: trimEndMs || 3000,
        trimDurationMs: (trimEndMs || 3000) - (trimStartMs || 0),
        onChange: onSelectTrim
      }}>
        <div className="fy-video-player">
          <div className="video-wrapper">
            <VideoFakeyou
              debug={false}
              height={height}
              controls={false}
              // muted={compState.isMuted}
              ref={videoRefCallback}
              {...rest}
            />

            {/* components that takes over for spinner and warning message */}
            <VideoTakeover height={height} status={compState.status}/>
          </div>{/* END of Video Wrapper */}
          <ScrubberBar status={compState.status}/>
          <ControlBar debug={debug} status={compState.status}/>
        </div>
      </TrimContext.Provider>
    </VideoElementContext.Provider>
  );
}

