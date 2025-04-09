import { ImageFormat } from "./video_audio_preprocessor";
import * as THREE from "three";
import { FrameWorkerManager } from "./workers/frame_worker_manager";

import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";

export interface IEngineFrameBuffers {
  colorFrames: (Blob | null)[];
  clearBuffer(name: BufferType): Promise<void>;
  checkIfBufferIsEmpty(buffer: BufferType): Promise<boolean>;
  countNonNullFrames(buffer: BufferType): Promise<number>;
}

export enum BufferType {
  COLOR = "colorFrames",
}

export interface EngineFrameBuffersError {
  message: string;
  code: number;
}

export class EngineFrameBuffers implements IEngineFrameBuffers {
  colorFrames: (Blob | null)[];

  private numberOfFrames: number;
  public hasCache: boolean;
  public colorRenderQueue: Promise<Blob>[];
  private webWorkers: boolean;

  public payloadZip: Blob | null;

  public frameWorkerManager: FrameWorkerManager | undefined;

  // for the client side zip.
  private zipFileWriter: BlobWriter | undefined;
  private zipWriter: ZipWriter<Blob> | undefined;

  private imageType = "image/jpeg";
  constructor(width: number, height: number) {
    this.colorFrames = [];
    this.colorRenderQueue = [];
    this.payloadZip = null;
    this.hasCache = false;

    this.zipFileWriter = undefined;
    this.zipWriter = undefined;

    //Check for SharedWorker support
    if (typeof Worker === "undefined") {
      console.error("Web Workers is not supported in this browser.");
      this.webWorkers = false;
    } else {
      this.webWorkers = true;
      console.error("Web Workers is supported in this browser.");
      this.frameWorkerManager = new FrameWorkerManager(
        width,
        height,
        "image/png",
      );
    }

    this.webWorkers = false;

    this.imageType = "image/jpeg";

    if (this.webWorkers == false) {
      this.zipFileWriter = new BlobWriter(this.imageType);
      this.zipWriter = new ZipWriter(this.zipFileWriter);
    }

    this.numberOfFrames = 0;
  }

  async retrieveFrame(
    rawRenderer: THREE.WebGLRenderer,
    imageFormat: ImageFormat,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      rawRenderer.domElement.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              //const imgData = reader.result as string;
              // if needed as a base 64
              resolve(blob);
            };
            reader.onerror = () => {
              reject({
                message: "Failed to Retrieve Frame and Serialize it.",
                code: 100,
              });
            };
            reader.readAsDataURL(blob);
          }
        },
        imageFormat,
        1.0,
      );
    });
  }

  async setRenderSurfaceSize(width: number, height: number) {
    if (this.webWorkers && this.frameWorkerManager) {
      this.frameWorkerManager.setCanvas(width, height);
    }
  }

  async enqueueWork(
    rawRenderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): Promise<void> {
    this.numberOfFrames += 1;
    if (this.webWorkers && this.frameWorkerManager) {
      this.frameWorkerManager.render(scene, camera, this.numberOfFrames);
    } else {
      const colorRenderTask = this.retrieveFrame(rawRenderer, ImageFormat.JPEG);
      this.colorRenderQueue.push(colorRenderTask);
    }
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

  async equeueAudio(audio: Blob) {}

  async collectColorFrames(final_length: number): Promise<void> {
    try {
      // webworker requires the COEP.
      if (this.webWorkers) {
        console.time("ColorQueueRenderTime Worker Time");
        if (this.webWorkers && this.frameWorkerManager) {
          console.log(`Collected Number of Frames: ${final_length}`);
          // this is sent off to video generation ...
          this.payloadZip =
            await this.frameWorkerManager.collectedFrames(final_length);
        }
        console.timeEnd("ColorQueueRenderTime Worker Time");
      } else {
        console.time("ColorQueueRenderTime");
        try {
          // going to have to zip here with the audio
          if (this.webWorkers == false) {
            console.log("Using Other Pathway.");
            this.colorFrames = await Promise.all(this.colorRenderQueue);
            console.log(this.colorFrames);
            // Check if zipFileWriter or zipWriter is undefined or null
            if (!this.zipFileWriter || !this.zipWriter) {
              console.log("Failed to Startup Zip File Writer");
              return;
            }

            this.colorFrames.forEach(async (blob, idx) => {
              try {
                if (!blob || !this.zipFileWriter) {
                  console.log("Failed to get Blob and Zip File Writer");
                  return;
                }

                //console.log(`Zipping Frame ${idx} to Zip`);
                const name = String(idx).padStart(5, "0"); // '0009'
                if (this.zipWriter) {
                  await this.zipWriter.add(`${name}.jpg`, new BlobReader(blob));
                } else {
                  console.error("zipWriter is undefined");
                }
              } catch (error) {
                console.log(error);
              }
            });

            this.payloadZip = await this.zipWriter.close();
            //this.downloadBlob(this.payloadZip, "test.zip");
          }
        } catch (error) {
          console.log("Error in Collecting Color Frames", error);
        }
        console.timeEnd("ColorQueueRenderTime");
      }
    } catch (error) {
      console.log(error);
    }

    this.hasCache = false;
  }

  // Testing function
  public downloadImageBlob(blob: Blob, filename: string) {
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    // Append the anchor to the document body
    document.body.appendChild(a);

    // Trigger a click event on the anchor
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(url);
  }

  async clearBuffer(name: BufferType): Promise<void> {
    switch (name) {
      case BufferType.COLOR:
        this.colorFrames = [];
        this.colorRenderQueue = [];
        this.payloadZip = null;
        this.numberOfFrames = 0;

        // reset the writers
        this.zipFileWriter = new BlobWriter(this.imageType);
        this.zipWriter = new ZipWriter(this.zipFileWriter);

        break;
      default:
        throw new Error("Invalid buffer name");
    }
  }

  async countNonNullFrames(buffer: BufferType): Promise<number> {
    return this[buffer].filter((frame) => frame !== null).length;
  }

  async checkIfBufferIsEmpty(buffer: BufferType): Promise<boolean> {
    return this[buffer].every((frame) => frame === null);
  }

  async logBufferInfo(buffer: BufferType): Promise<void> {
    const nonNullFrameCount = await this.countNonNullFrames(buffer);
    console.log(
      `Buffer Info - ${buffer}: ${nonNullFrameCount} non-null frames`,
    );
  }
}
