// Listen for messages from the main thread
self.addEventListener("message", async function (event) {
  const imageBitmap = event.data.imageBitmap;
  const width = event.data.width;
  const height = event.data.height;

  const holdingCanvas = new OffscreenCanvas(width, height);
  // in the worker use queue and pass the imageBitmap
  const ctx = holdingCanvas.getContext("bitmaprenderer");
  ctx.transferFromImageBitmap(imageBitmap);
  const blob = await holdingCanvas.convertToBlob({
    quality: 1.0,
    type: "image/png",
  });

  self.postMessage(blob); // Send the result back to the main thread
});
