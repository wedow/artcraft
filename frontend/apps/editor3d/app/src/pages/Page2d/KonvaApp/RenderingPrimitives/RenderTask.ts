import { bool } from "@techstark/opencv-js";

export enum WorkerEvent {
  START = "start",
  PROGRESS = "progress",
  COMPLETE = "complete",
  DATA = "data",
  ERROR = "error",
}

export interface RenderTaskPayload {
  offscreenCanvas: OffscreenCanvas;
  id: number;
}

// RenderSharedWorker.ts
export interface RenderTask {
  jobID: number;
  isDone: bool;
  event: WorkerEvent;
  data: RenderTaskPayload | undefined;
}

export interface RenderTaskProgress {
  isProcessing: boolean;
  progress: number;
  jobID: number;
  event: WorkerEvent;
}

export interface RenderTaskResult {
  event: Worker;
  jobID: number;
  data: {
    mediaUrl: string;
  };
}
