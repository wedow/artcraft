// This is responsible for processing and turning the data into

class ImageProcessorWorker {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.holdingCanvas = new OffscreenCanvas(0, 0);
    this.ctx = this.holdingCanvas.getContext("bitmaprenderer");
    this.imageType = "image/png";
  }

  enqueueTask(imageBitmap, width, height, id) {
    this.queue.push({ imageBitmap, width, height, id });
  }

  async processQueue() {
    // If already processing, return to avoid duplicate execution
    console.log(`Current Queue Length ${this.queue.length}`);
    if (this.queue.length > 0) {
      const { imageBitmap, width, height, id } = this.queue.shift();
      console.log(`Working On an Frame Id ${id}`);

      this.holdingCanvas.width = width;
      this.holdingCanvas.height = height;

      try {
        // Create or reuse the offscreen canvas
        this.ctx.transferFromImageBitmap(imageBitmap);

        // Convert the canvas content to a Blob
        const blob = await this.holdingCanvas.convertToBlob({
          quality: 1.0,
          type: this.imageType,
        });

        // Send the Blob back to the main thread
        self.postMessage({ blob, id });
      } catch (error) {
        console.error("Error processing image:", error);
        self.postMessage({ error: error.message });
      }
    }

    console.log("Processing");
    setTimeout(this.processQueue.bind(this), 0);
  }
}

// Instantiate the ImageProcessorWorker
const runner = new ImageProcessorWorker();
let start = false;

self.addEventListener("message", async (event) => {
  console.log(event.data);
  const { type, imageBitmap, width, height, frame } = event.data;
  console.log(`${type}: ${imageBitmap} ${width} ${height} ${frame}`);

  if (start == false) {
    start = true;
    await runner.processQueue();
  }

  runner.enqueueTask(imageBitmap, width, height, frame);
});
