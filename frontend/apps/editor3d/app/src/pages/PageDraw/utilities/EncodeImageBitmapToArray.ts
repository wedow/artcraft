
export const EncodeImageBitmapToArray = async (imageBitmap: ImageBitmap): Promise<Uint8Array> => {


  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
  const clampedArray = imageData.data; // Uint8ClampedArray
  return new Uint8Array(clampedArray.buffer);

  /*// Create a temporary canvas
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  // Draw the ImageBitmap onto the canvas
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  ctx.drawImage(imageBitmap, 0, 0);

  // Convert to base64
  const base64String = canvas.toDataURL("image/png");

  // Clean up
  canvas.remove();

  // Remove the data:image/png;base64, prefix if you want just the base64 string
  return base64String.split(",")[1];*/
}
