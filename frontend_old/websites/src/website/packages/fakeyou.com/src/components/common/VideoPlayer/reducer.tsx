import {
  MIN_VID_DURATION,
} from "./utilities";

export enum STATE_STATUSES {
  INIT = "init",
  VIDEO_METADATA_LOADED = "video_metadata_loaded",
  ERROR_VIDEO_TOO_SHORT = "error_video_too_short",
  ERROR_LOAD_ORDER = "error_load_order",
  ERROR_ACTION_TYPE = "error_no_such_action"
};

export type State = {
  status: string;
  errorMessage: string[];
  videoDuration: number | undefined;
  canNotTrim: boolean | undefined;
};
export const initialState = {
  status: STATE_STATUSES.INIT,
  errorMessage : [],
  videoDuration: undefined,
  canNotTrim: undefined,
}

export enum ACTION_TYPES {
  ON_LOADED_METADATA = "on_loaded_metadata",
};

export type Action = 
  | {type: ACTION_TYPES.ON_LOADED_METADATA, payload: {videoDuration: number}};

export function reducer(state: State, action: Action): State {
  switch(action.type){
    case ACTION_TYPES.ON_LOADED_METADATA:{
      if(action.payload.videoDuration >= MIN_VID_DURATION){
        return{
          ...state,
          status: STATE_STATUSES.VIDEO_METADATA_LOADED,
          videoDuration: action.payload.videoDuration,
        }
      }else{
        return {
          ...state,
          status: STATE_STATUSES.ERROR_VIDEO_TOO_SHORT,
          errorMessage: [...state.errorMessage, `Videos need to be at least ${MIN_VID_DURATION}s long`],
          videoDuration: action.payload.videoDuration,
        }
      }
    }
    default:{
      return {
        ...state,
        status: STATE_STATUSES.ERROR_ACTION_TYPE,
        errorMessage: [...state.errorMessage, "Reducer Action switch's default case is reached"]
      }
    }
  }
}
