import { v4 as uuidv4 } from "uuid";
import {
  SharedWorkerRequest,
  SharedWorkerResponse,
} from "~/KonvaApp/WorkerPrimitives/SharedWorkerBase";
import { ResponseType } from "~/KonvaApp/WorkerPrimitives/SharedWorkerBase";
import DiffusionSharedWorker from "./DiffusionSharedWorker?sharedworker";

export class DiffusionSharedWorkerClient<
  DiffusionSharedWorkerItemData,
  DiffusionSharedWorkerResponseData,
  DiffusionSharedWorkerProgressData,
> {
  private port: MessagePort;
  private sharedWorker: SharedWorker;
  private messageReceived: (
    response: SharedWorkerResponse<
      DiffusionSharedWorkerResponseData,
      DiffusionSharedWorkerProgressData
    >,
  ) => void;
  constructor(
    messageReceived: (
      response: SharedWorkerResponse<
        DiffusionSharedWorkerResponseData,
        DiffusionSharedWorkerProgressData
      >,
    ) => void,
  ) {
    this.messageReceived = messageReceived;
    try {
      console.log("This is running a worker in production");
      this.sharedWorker = new DiffusionSharedWorker({
        name: "DiffusionWorker-" + uuidv4(),
      });

      this.sharedWorker.addEventListener("error", (value) => {
        console.log("Shared worker ERROR:");
        console.log(value);
      });

      this.port = this.sharedWorker.port;
      this.port.onmessage = this.onMessage.bind(this);
      this.port.start();

      console.log("launched shared worker (?)");
    } catch (error) {
      console.log("ERROR with shared worker!");
      console.log(error);
      throw Error("Could Not Start Worker");
    }
  }

  async onMessage(event: MessageEvent) {
    // returns progress and returns result need to check error tomorrow then were good to go.
    //console.log(`incoming`);
    // console.log(event);
    if (event.data.responseType === ResponseType.error) {
      console.log(`DiffusionSharedWorkerClient Error`);
      console.log(event.data);
      this.messageReceived(event.data);
    } else if (event.data.responseType === ResponseType.progress) {
      // console.log(`DiffusionSharedWorkerClient Progress`);
      //console.log(event.data);
      this.messageReceived(event.data);
    } else if (event.data.responseType === ResponseType.result) {
      // console.log(`DiffusionSharedWorkerClient Result`);
      //console.log(event.data);
      this.messageReceived(event.data);
    } else {
      console.log(`DiffusionSharedWorkerClient Message Unknown:`);
      console.log(event.data);
    }
  }

  async sendData(
    jobID: number,
    data: DiffusionSharedWorkerItemData,
    isDoneStreaming: boolean,
  ) {
    const payload: SharedWorkerRequest<DiffusionSharedWorkerItemData> = {
      jobID: jobID,
      data: data,
      isDoneStreaming: isDoneStreaming,
    };
    this.port.postMessage(payload);
  }
}
