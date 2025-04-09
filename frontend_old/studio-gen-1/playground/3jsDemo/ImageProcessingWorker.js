import * as THREE from "three";

export class FrameCollectorManager {
  constructor(width, height, expectedFramesLength = 720) {
    this.worker = new Worker("canvas-queued-worker.js");
    this.worker.addEventListener("message", this.handleMessage.bind(this));

    this.frames = [];

    this.expectedFramesLength = expectedFramesLength;

    this.offscreenCanvas = new OffscreenCanvas(width, height);
    this.width = width;
    this.height = height;
    this.offScreenRenderer = new THREE.WebGLRenderer({
      canvas: this.offscreenCanvas,
    });
  }

  setCanvas(width, height) {
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
  }

  handleMessage(event) {
    console.time("Decode");
    console.log("Message from Decode:", event.data);
    const { id, blob } = event.data;
    console.log(`${id} Frame id: ${blob}`);
    console.timeEnd("Decode");
    this.frames.push(blob);
    console.log(this.frames.length);

    // create shared worker
    if (this.frames.length === this.expectedFramesLength) {
      console.log("Complete");
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async collectedFrames() {
    while (this.frames.length != this.expectedFramesLength) {
      await this.sleep(1);
    }

    return this.frames;
  }

  terminate() {
    this.worker.terminate();
    console.log("Worker Terminated");
  }

  render(scene, camera, frame) {
    this.offScreenRenderer.render(scene, camera);
    const imageBitmap = this.offscreenCanvas.transferToImageBitmap();
    this.processFrame(imageBitmap, frame);
  }

  processFrame(imageBitmap, frame) {
    const width = this.width;
    const height = this.height;
    const action = "process";

    this.worker.postMessage({
      action,
      imageBitmap,
      width,
      height,
      frame,
    });
  }
}
