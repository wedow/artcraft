import * as THREE from "three";

import { FrameCollectorManager } from "./ImageProcessingWorker.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

const totalFrames = 720;

const imageProcessing = new FrameCollectorManager(
  window.innerWidth,
  window.innerHeight,
  totalFrames,
);

let frame = 0;

// const sharedWorker = new SharedWorker("ffmpeg-worker.js");
// // Start the port
// sharedWorker.port.start();
// const message = { message: "Hello" };
// sharedWorker.port.postMessage(message);

if (typeof SharedWorker !== "undefined") {
  console.log("Shared Workers are supported.");
  // You can safely create a Shared Worker here
  const worker = new SharedWorker("ffmpeg-worker.js", { type: "module" });

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

async function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  frame += 1;
  // buckets the frames.

  if (frame <= totalFrames) {
    //console.time("Render");
    // can use the canvas renderer to enqueue as an option.
    //imageProcessing.render(scene, camera, frame);
    //console.timeEnd("Render");
  }

  // block and wait for all the frames

  renderer.render(scene, camera);
}
