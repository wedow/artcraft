import { NetworkedNode } from "../Nodes/NetworkedNode";

export interface ProgressEventDetails<S> {
  progress: number;
  message?: string;
  status?: S;
}
export interface NodeProgressEventDetail<S> extends ProgressEventDetails<S> {
  node: NetworkedNode;
}

export enum VideoExtractionEvents {
  "SESSION_CREATING" = "SESSION_CREATING",
  "SESSION_IDLE" = "SESSION_IDLE",
  "EXTRACTION_POINT_REQUEST" = "EXTRACTION_POINT_REQUEST",
  "SESSION_CLOSING" = "SESSION_CLOSING",
  "SESSION_CLOSED" = "SESSION_CLOSED",
}
export interface VideoExtractionEventDetails
  extends ProgressEventDetails<VideoExtractionEvents> {
  status: VideoExtractionEvents;
}
