interface Task {
  imageBitmap: ImageBitmap;
  width: number;
  height: number;
  id: number;
}

import { ClipUI } from "~/pages/PageEnigma/datastructures/clips/clip_ui";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";

class FrameProcessorWorker {
  private holdingCanvas: OffscreenCanvas;
  private ctx: ImageBitmapRenderingContext | null;
  public imageType: string;

  private zipFileWriter: BlobWriter;
  private zipWriter: ZipWriter<Blob>;

  private decodeQueue: Task[];

  public audio_data: ClipUI[];

  public isProcessing: boolean;

  public final_length: number;
  public item_count: number;
  constructor() {
    this.final_length = 0;
    this.holdingCanvas = new OffscreenCanvas(0, 0);
    this.ctx = this.holdingCanvas.getContext("bitmaprenderer");
    this.imageType = "image/jpeg";

    // Zipping
    this.decodeQueue = [];
    this.zipFileWriter = new BlobWriter(this.imageType);
    this.zipWriter = new ZipWriter(this.zipFileWriter);

    this.audio_data = [];

    this.isProcessing = false;
    this.item_count = 0;
  }

  async startZipProcessQueue(): Promise<void> {
    if (this.decodeQueue.length > 0 && this.isProcessing == false) {
      this.isProcessing = true;

      const task = this.decodeQueue.shift();
      if (task) {
        const { imageBitmap, width, height, id } = task;
        // Proceed with processing the task

        //console.log(`Working On an Frame Id ${id}`);
        this.holdingCanvas.width = width;
        this.holdingCanvas.height = height;

        try {
          // Create or reuse the offscreen canvas
          this.ctx?.transferFromImageBitmap(imageBitmap);

          // Convert the canvas content to a Blob
          const blob = await this.holdingCanvas.convertToBlob({
            quality: 1.0,
            type: this.imageType,
          });

          // Send the Blob back to the main thread
          //console.log(`Zipping Frame ${id} to Zip`);
          const name = String(id).padStart(5, "0"); // '0009'
          await this.zipWriter.add(`${name}.jpg`, new BlobReader(blob));

          this.item_count++;
        } catch (error) {
          console.error("Error processing image:", error);
          self.postMessage({ error: (error as Error).message }); //
        } finally {
          this.isProcessing = false;
        }
      } else {
        console.log("Queue is empty, no task to process.");
        return;
      }
    }
    // have this function loop
    setTimeout(this.startZipProcessQueue.bind(this), 0);
  }

  async zipFile() {
    // ensure that this queue is done before zipping
    console.log(`Waiting to Finish Decoding: ${this.decodeQueue.length}`);
    console.log(`Decoded Count: ${this.item_count}`);
    console.log(`Final Length: ${this.final_length}`);
    if (this.item_count === this.final_length) {
      console.log("Zipping");
      const result = await this.zipWriter.close();
      self.postMessage({ result: result });
      // reset the item count and final length
      this.item_count = 0;
      this.final_length = 0;

      // Zipping
      this.decodeQueue = [];
      this.zipFileWriter = new BlobWriter(this.imageType);
      this.zipWriter = new ZipWriter(this.zipFileWriter);
      this.audio_data = [];
      this.isProcessing = false;

      return;
    } else {
      setTimeout(this.zipFile.bind(this), 0);
    }
  }

  public enqueueTask(
    imageBitmap: ImageBitmap,
    width: number,
    height: number,
    id: number,
  ): void {
    this.decodeQueue.push({ imageBitmap, width, height, id });
  }
}

const runner = new FrameProcessorWorker();
let start = false;

self.addEventListener("message", async (event: MessageEvent) => {
  const {
    type,
    imageBitmap,
    width,
    height,
    frame,
    audio_data,
    zip,
    final_length,
  } = event.data;

  // console.log(
  //   `${type}: ${imageBitmap} ${width} ${height} ${frame} ${audio_data} ${zip} ${final_length}`,
  // );

  if (start == false) {
    start = true;
    runner.imageType = type;
    await runner.startZipProcessQueue();
  }

  if (audio_data || zip) {
    if (audio_data) {
      runner.audio_data = audio_data;
    }
    if (zip) {
      console.log(`Worker Reported Final Length: ${final_length}`);
      runner.final_length = final_length;
      await runner.zipFile();
    }
    return;
  }

  runner.enqueueTask(imageBitmap, width, height, frame);
});
