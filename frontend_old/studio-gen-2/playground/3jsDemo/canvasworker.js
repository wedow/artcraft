class CanvasProcessor {
  constructor() {
    this.queue = [];
    this.totalItems = 0;
    this.completedItems = 0;
    this.running = true;
  }

  // Add a canvas to the processing queue
  enqueueCanvas(canvas, id) {
    this.queue.push({ canvas, id });
  }

  // Set the total number of items to process
  setTotalItems(count) {
    this.totalItems = count;
  }

  // Start the processing loop
  async processQueue() {
    while (this.running) {
      if (this.queue.length > 0) {
        await this.processNext();
      }

      // Check if all items have been processed
      if (this.completedItems >= this.totalItems) {
        self.postMessage({ command: "done", message: "All items processed." });
        this.running = false;
      }

      await this.sleep(100); // Small delay to prevent blocking
    }
  }

  // Process the next canvas in the queue
  async processNext() {
    if (this.queue.length > 0) {
      const { canvas, id } = this.queue.shift();

      try {
        const blob = await canvas.convertToBlob();

        this.completedItems++;
        const percentageComplete =
          (this.completedItems / this.totalItems) * 100;

        self.postMessage({
          id,
          blob,
          completedItems: this.completedItems,
          totalItems: this.totalItems,
          percentageComplete,
        });
      } catch (error) {
        self.postMessage({ id, error: error.message });
      }
    }
  }

  // Utility to sleep for a specified time
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Instantiate the processor
const processor = new CanvasProcessor();

// Listen for messages from the main thread
self.addEventListener("message", function (event) {
  const data = event.data;

  if (data.totalItems) {
    processor.setTotalItems(data.totalItems);
  }

  if (data.canvas) {
    processor.enqueueCanvas(data.canvas, data.id);
  }

  if (data.command === "start") {
    processor.processQueue();
  }

  if (data.command === "stop") {
    processor.running = false;
  }
});
