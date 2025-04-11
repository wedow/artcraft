import {createContext} from 'react';

export const VideoElementContext = createContext<HTMLVideoElement | null>(null);
export type TrimContextType = {
  trimStartMs: number,
  trimEndMs:number,
  trimDurationMs:number
  onChange: ({
    trimStartMs,trimEndMs,
  }:{
    trimStartMs: number,
    trimEndMs:number,
  })=>void
}
export const TrimContext = createContext<TrimContextType| null>(null)