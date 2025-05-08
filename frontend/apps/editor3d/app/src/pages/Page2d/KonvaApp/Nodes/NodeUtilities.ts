import Konva from "konva";
import { Position, Size, TransformationData } from "../types";
import { minNodeSize, transparent } from "./constants";

export const NodeUtilities = {
  adjustNodeSizeToCanvas,
  downloadOffscreenCanvas,
  getInitialTransform,
  isAssetUrlAvailable,
  positionNodeOnCanvasCenter,
  printKNodeAttrs,
  urlToBlob,
};
function downloadOffscreenCanvas(canvas: OffscreenCanvas) {
  canvas.convertToBlob().then((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "offscreen-canvas-image.png"; // Specify the file name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url); // Clean up
    }
  });
}
function getInitialTransform({
  existingTransform,
  mediaFileSize,
  canvasPosition,
  canvasSize,
}: {
  existingTransform?: TransformationData;
  mediaFileSize?: Size;
  canvasPosition: Position;
  canvasSize: Size;
}) {
  return existingTransform
    ? {
        ...existingTransform,
        position: {
          x: existingTransform.position.x + canvasPosition.x,
          y: existingTransform.position.y + canvasPosition.y,
        },
        fill: transparent,
      }
    : {
        position: positionNodeOnCanvasCenter({
          canvasOffset: canvasPosition,
          componentSize: mediaFileSize ?? minNodeSize,
          maxSize: canvasSize,
        }),
        size: mediaFileSize ?? minNodeSize,
        fill: "gray",
      };
}

function adjustNodeSizeToCanvas({
  componentSize,
  maxSize,
}: {
  componentSize: Size;
  maxSize: Size;
}) {
  const adjustedSize = {
    width: componentSize.width,
    height: componentSize.height,
  };
  if (adjustedSize.width > maxSize.width) {
    const scaleDown = maxSize.width / adjustedSize.width;
    adjustedSize.width = adjustedSize.width * scaleDown;
    adjustedSize.height = adjustedSize.height * scaleDown;
  }
  if (adjustedSize.height > maxSize.height) {
    const scaleDownAgain = maxSize.height / adjustedSize.height;
    adjustedSize.width = adjustedSize.width * scaleDownAgain;
    adjustedSize.height = adjustedSize.height * scaleDownAgain;
  }
  return adjustedSize;
}

function positionNodeOnCanvasCenter({
  canvasOffset,
  componentSize,
  maxSize,
}: {
  canvasOffset: Position;
  componentSize: Size;
  maxSize: Size;
}) {
  return {
    x: canvasOffset.x + maxSize.width / 2 - componentSize.width / 2,
    y: canvasOffset.y + maxSize.height / 2 - componentSize.height / 2,
  };
}

function printKNodeAttrs(kNode: Konva.Node) {
  console.log({
    position: kNode.position(),
    size: kNode.size(),
    scale: kNode.scale(),
    rotation: kNode.rotation(),
  });
}
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to check if the URL returns a 200 status
async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.status === 200;
  } catch (error) {
    console.error("Error fetching URL:", error);
    return false;
  }
}
// wait using a while loop to display the result.
async function isAssetUrlAvailable({
  url,
  sleepDurationMs = 500,
  totalRetries,
}: {
  url: string;
  sleepDurationMs?: number;
  totalRetries?: number;
}): Promise<boolean> {
  let retryCount = 0;
  let isAvailable = false;
  const totalRetriesReached = () => {
    if (!totalRetries) {
      return false;
    }
    return retryCount >= totalRetries;
  };
  while (!isAvailable && !totalRetriesReached()) {
    isAvailable = await checkUrl(url);
    if (!isAvailable) {
      console.log("Asset at Url not available yet, retrying...");
      retryCount = retryCount + 1;
      await sleep(sleepDurationMs);
    } else if (import.meta.env.DEV) {
      console.log("Preview Image is available:", url);
    }
  }
  return isAvailable;
}

async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch resource: ${response.statusText}`);
  }
  const blob = await response.blob();
  return blob;
}
