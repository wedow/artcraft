import {
  WorkFunction,
  ProgressData,
  WorkQueue,
  WorkResult,
} from "./GenericWorker";

// Protocol
export enum ResponseType {
  progress,
  result,
  error,
}

export enum RequestType {
  cancel,
  start,
  startStream,
  endStream,
}

// These are the containers to send data over the ports
// where R is response data
// where P is progress data
// where I is item data
export interface SharedWorkerResponse<R, P> {
  jobID: number;
  responseType: ResponseType;
  data: R | P | string | undefined;
}

export interface SharedWorkerRequest<I> {
  jobID: number;
  data: I;
  isDoneStreaming: boolean;
}

// Where I is the work item data
// Where R is the response data
// Where P is the progress data
export class SharedWorkerBase<I, R, P> {
  private port: MessagePort;
  protected workQueue: WorkQueue<I, R, P> | undefined;

  constructor(port: MessagePort) {
    this.port = port;
    this.workQueue = undefined;
    this.port.onmessage = this.receiveFromPort.bind(this);
  }

  setup(
    workFunction: WorkFunction<I, R, P> | undefined,
    progressCallback: (progressData: ProgressData<P>) => void,
  ) {
    if (!workFunction) {
      console.log("Work Function is Undefined.");
      return;
    }
    this.workQueue = new WorkQueue<I, R, P>(
      workFunction,
      progressCallback,
      this.reportResult.bind(this),
      this.errorFunction.bind(this),
    );
  }

  // Override
  public errorFunction(error: SharedWorkerResponse<I, R>) {
    console.log("Please Override Error Function");
  }

  // Call to start the worker
  public async start() {
    if (!this.workQueue) {
      console.log("Work Queue Not Initialized");
      return;
    }
    this.workQueue.start();
  }

  protected async send(data: SharedWorkerResponse<R, P>) {
    this.port.postMessage(data);
  }

  // Must override in SharedWorker subclass
  public async receive(request: SharedWorkerRequest<I>) {
    // override this
    console.log("Receive Override in subclass");
  }

  public async receiveFromPort(event: any) {
    console.log(`UnWrapping Event ${event}`);
    this.receive(event.data);
  }

  public async submitWork(request: SharedWorkerRequest<I>) {
    if (!this.workQueue) {
      console.log("Missing work queue cannot submit work");
      return;
    }
    this.workQueue.addWork({
      jobID: request.jobID,
      data: request.data,
      finishedStreamingInput: request.isDoneStreaming,
    });
  }

  // override this for subclass;
  public reportResult(result: WorkResult<R | undefined>): void {
    console.log("Must Override ReportResult");
  }
}
