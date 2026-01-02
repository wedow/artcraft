
export const EncodeImageBitmapToArray = async (imageBitmap: ImageBitmap): Promise<Uint8Array> => {
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  ctx.drawImage(imageBitmap, 0, 0);

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const arrayBuffer = await blob.arrayBuffer();

  return new Uint8Array(arrayBuffer);
}
