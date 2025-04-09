// Example of this working.
import { ProgressData, WorkResult } from "../GenericWorker";
import {
  SharedWorkerBase,
  SharedWorkerRequest,
  ResponseType,
} from "../SharedWorkerBase";

export interface ExP {}
export interface ExI {}
export interface ExR {}

export class TemplateSharedWorker extends SharedWorkerBase<ExI, ExR, ExP> {
  constructor(port: MessagePort) {
    super(port);
    this.setup(this.workFunction.bind(this), this.progressFunction.bind(this));
  }
  // Data here will be shipped off for progressive loading
  async workFunction(
    isDoneStreaming: boolean,
    item: ExI,
    reportProgress: (progress: number, data: ExP) => void,
  ): Promise<[ExR | undefined, boolean]> {
    console.log(`Working Item ${item}`);

    const exP = {};
    reportProgress(0, exP);

    const exR: ExR = {};

    if (isDoneStreaming) {
      return [exR, true];
    } else {
      return [undefined, false];
    }
  }

  progressFunction(progress: ProgressData<ExP>) {
    console.log(
      `Progress Function  JobID:${progress.jobID} Data:${progress.data} Progress:${progress.progress}`,
    );

    // send out to node as a worker response
    this.send({
      jobID: progress.jobID,
      responseType: ResponseType.progress,
      data: progress.data,
    });
  }

  reportResult(result: WorkResult<ExR>) {
    console.log(`Result: jobID:${result.jobID} result:${result.data}`);
    this.send({
      jobID: result.jobID,
      responseType: ResponseType.result,
      data: result.data,
    });
  }

  async receive(request: SharedWorkerRequest<ExI>) {
    console.log("Received Request");
    console.log(request);
    this.submitWork({
      jobID: request.jobID,
      data: request.data,
      isDoneStreaming: request.isDoneStreaming,
    });
  }
}

// This is a copy paste to create a worker now.
self.onconnect = (e: any) => {
  const port = e.ports[0];
  console.log("TemplateSharedWorker Started");
  let worker: TemplateSharedWorker | undefined = undefined;
  let started = false;

  if (started === false) {
    started = true;
    worker = new TemplateSharedWorker(port);
    worker.start();
  }

  // Response For Start.
  const workerResult = "TemplateSharedWorker Started";
  port.postMessage(workerResult);
  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};
