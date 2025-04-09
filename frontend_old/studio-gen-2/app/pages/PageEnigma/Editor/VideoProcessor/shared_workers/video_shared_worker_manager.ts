class VideoProcessingSharedWorkerManager {
  constructor() {
    if (typeof SharedWorker !== "undefined") {
      console.log("Shared Workers are supported.");
      // You can safely create a Shared Worker here
      const worker = new SharedWorker(
        "app/pages/PageEnigma/Editor/VideoProcessor/shared_workers/video_shared_worker_manager.ts",
        { type: "module" },
      );

      // Get the port for communication
      const port = worker.port;

      // Listen for messages from the worker
      port.addEventListener("message", function (event) {
        console.log("Message received from worker:", event.data);
      });

      // Start the port
      port.start();

      // Send a message to the worker
      port.postMessage("Hello from the main script!");
    } else {
      console.log("Shared Workers are not supported in this browser.");
    }
  }
  async enqueueWork(frames: [string]) {}

  async completedWork() {}
}
