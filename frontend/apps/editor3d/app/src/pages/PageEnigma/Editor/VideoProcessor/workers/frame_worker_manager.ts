import * as THREE from "three";
// import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";

interface WorkerMessageEvent extends MessageEvent {
  data: {
    result: Blob;
  };
}

export class FrameWorkerManager {
  private worker: Worker;
  private offscreenCanvas: OffscreenCanvas;
  private offScreenRenderer: THREE.WebGLRenderer;
  public type: string;

  private blobResult: Blob | undefined;

  constructor(width: number, height: number, type: string = "image/jpeg") {
    this.type = type;

    this.worker = new Worker(
      "app/pages/PageEnigma/Editor/VideoProcessor/workers/frame_processor_worker.ts",
      { type: "module" },
    );
    this.worker.addEventListener("message", this.handleMessage.bind(this));

    this.offscreenCanvas = new OffscreenCanvas(width, height);
    this.offScreenRenderer = new THREE.WebGLRenderer({
      canvas: this.offscreenCanvas,
    });
  }

  setCanvas(width: number, height: number): void {
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
  }

  handleMessage(event: WorkerMessageEvent): void {
    const { result } = event.data;
    console.log(result);
    // zip file
    this.blobResult = result;
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async collectedFrames(final_length: number): Promise<Blob> {
    // to get the zip file
    console.log(`The Last Frame Number is: ${final_length}`);
    this.worker.postMessage({
      type: this.type,
      imageBitmap: undefined,
      width: undefined,
      height: undefined,
      frame: undefined,
      audio_data: undefined,
      zip: true,
      final_length: final_length,
    });

    while (this.blobResult === undefined) {
      await this.sleep(1);
    }

    const result = this.blobResult;
    this.blobResult = undefined;

    // For testing.
    //this.downloadBlob(result, "test.zip");

    if (!result) {
      throw Error("Failed to Compress Payload");
    }
    return result;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    // Create an object URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // Specify the filename

    // Append the anchor to the document body
    document.body.appendChild(a);

    // Trigger a click event on the anchor
    a.click();

    // Clean up by revoking the object URL and removing the anchor element
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  public terminate(): void {
    this.worker.terminate();
    console.log("Worker Terminated");
  }

  public render(scene: THREE.Scene, camera: THREE.Camera, frame: number): void {
    this.offScreenRenderer.render(scene, camera);
    const imageBitmap = this.offscreenCanvas.transferToImageBitmap();
    this.processFrame(imageBitmap, frame);
  }

  private processFrame(imageBitmap: ImageBitmap, frame: number): void {
    const width = this.offscreenCanvas.width;
    const height = this.offscreenCanvas.height;
    const type = this.type;

    this.worker.postMessage({
      type,
      imageBitmap,
      width,
      height,
      audio_data: undefined,
      frame,
      zip: false,
    });
  }
}
