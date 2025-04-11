// Item in and Result of the Promise, the response is a boolean
// that will dictate whether we should return the result to the main thread.

import { ResponseType, SharedWorkerResponse } from "./SharedWorkerBase";

// Does work with the data and returns progress and any progress data.
// result is undefined if still streaming
export type WorkFunction<I, R, P> = (
  isDoneStreaming: boolean,
  workItem: I,
  reportProgress: (data: P) => void,
) => Promise<[R | undefined, boolean]>;

// Work Item with Type T
export interface WorkItem<T> {
  jobID: number;
  data: T;
  finishedStreamingInput: boolean;
}

// Work Result R
export interface WorkResult<R> {
  jobID: number;
  data: R;
}

// Streamed Progress with or without data
export interface ProgressData<P> {
  jobID: number;

  data: P | undefined;
}

export enum WorkerEvent {
  START = "start",
  PROGRESS = "progress",
  COMPLETE = "complete",
  DATA = "data",
  ERROR = "error",
}

// Handles streaming work in a queue.
export class WorkQueue<I, R, P> {
  private queue: WorkItem<I>[] = [];
  private isProcessing: boolean = false;

  // Streaming workers wait for a stop before they return a result used for frames.
  // if not then it produces one result for one work item off the main thread.

  protected workFunction: WorkFunction<I, R, P> | undefined;
  protected resultFunction: (result: WorkResult<R | undefined>) => void;
  protected errorFunction: (error: SharedWorkerResponse<I, R>) => void;
  protected progressCallback: (
    progressData: ProgressData<P>,
  ) => void | undefined;

  constructor(
    workFunction: WorkFunction<I, R, P>,
    progressCallback: (progressData: ProgressData<P>) => void,
    resultFunction: (result: WorkResult<R | undefined>) => void,
    errorFunction: (error: SharedWorkerResponse<I, R>) => void,
  ) {
    this.workFunction = workFunction;
    this.progressCallback = progressCallback;
    this.resultFunction = resultFunction;
    this.errorFunction = errorFunction;
  }

  async addWork(workItem: WorkItem<I>): Promise<void> {
    this.queue.push(workItem);
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const workItem = this.queue.shift();
      if (workItem) {
        try {
          // The Data E here is used to stream back any extra images or anything.

          // FOR SOME REASON THIS CALLS at the end of the stream.
          const reportProgress = (data: P) => {
            this.progressCallback({
              jobID: workItem.jobID,
              data: data, // could be url's some kind of data
            });
          };
          if (!this.workFunction) {
            console.log("Work Function is Null Generic Worker");
            return;
          }
          const result = await this.workFunction(
            workItem.finishedStreamingInput,
            workItem.data,
            reportProgress,
          );
          // should report
          if (result[1] === true) {
            this.reportResult({ jobID: workItem.jobID, data: result[0] });
          } else {
            //console.log("Work Function is not done producing result");
          }
        } catch (error) {
          // catches errors from the worker and sends it back as an error

          if (!this.errorFunction) {
            console.log("Didn't Setup Error Function in Generic Worker");
            return;
          }

          this.errorFunction({
            jobID: workItem.jobID,
            responseType: ResponseType.error,
            data: error as string,
          });
          // proprogate to the error callback
        }
      }
    }
    console.log("Done Processing Waiting");
    setTimeout(this.processQueue.bind(this), 500);
  }

  public start() {
    if (this.isProcessing) {
      console.log("Started Already");
      return;
    }
    this.isProcessing = true;
    this.processQueue();
  }

  public reportResult(result: WorkResult<R | undefined>): void {
    console.log(`Job ${result.jobID} completed with result:`, result.data);
    // You can replace this with any reporting mechanism you need
    if (!this.resultFunction) {
      console.log("Missing Result Function in Generic Worker");
      return;
    }
    // passes off to sharedworkerbase to be overriden
    this.resultFunction(result);
  }
}
