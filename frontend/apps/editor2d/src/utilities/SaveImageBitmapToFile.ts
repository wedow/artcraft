
export const SaveImageBitmapToFile = async (imageBitmap: ImageBitmap): Promise<void> => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");

    ctx.drawImage(imageBitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/png");
    });

    await FileUtilities.blobToFileJpeg(blob, "output");
  } catch (error) {
    console.error("Error saving output:", error);
  }
}
