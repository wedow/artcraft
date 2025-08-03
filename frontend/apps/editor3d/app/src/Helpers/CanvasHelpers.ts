
export const normalizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement => {
  const newCanvas = document.createElement("canvas");
  newCanvas.width = width;
  newCanvas.height = height;

  const ctx = newCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0, width, height);
  return newCanvas;
}
