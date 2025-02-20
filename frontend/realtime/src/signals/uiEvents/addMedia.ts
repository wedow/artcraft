import { signal, effect } from "@preact/signals-react";
import { TextNodeData } from "~/KonvaApp/types";

// ADDING IMAGES
const stagedImage = signal<File | null>(null);
const addImageToEngine = (image: File) => {
  stagedImage.value = image;
};

const onGetStagedImage = (callback: (file: File) => void) => {
  effect(() => {
    if (stagedImage.value) {
      callback(stagedImage.value);
    }
  });
};

// ADDING VIDEOS
type VideoSignal = {
  mediaFileToken: string;
  mediaFileUrl: string;
  videoWidth: number;
  videoHeight: number;
};
const stagedVideo = signal<VideoSignal | null>(null);

const addVideoToEngine = (videoData: VideoSignal) => {
  stagedVideo.value = videoData;
};

const onGetStagedVideo = (callback: (videoData: VideoSignal) => void) => {
  effect(() => {
    if (stagedVideo.value) {
      callback(stagedVideo.value);
    }
  });
};

// ADD and EDIT TEXT
const stagedText = signal<TextNodeData | null>(null);
const addTextToEngine = (data: TextNodeData) => {
  stagedText.value = data;
};
const onAddTextToEngine = (callback: (data: TextNodeData) => void) => {
  effect(() => {
    if (stagedText.value) {
      callback(stagedText.value);
    }
  });
};

// Add shapes
// TODO: Remove this line and replace with actual shape data that engine needs
type ShapeNodeData = any;
const stagedShape = signal<ShapeNodeData | null>(null);
const addShapeToEngine = (data: ShapeNodeData) => {
  stagedShape.value = data;
}
const onAddShapeToEngine = (callback: (data: ShapeNodeData) => void) => {
  effect(() => {
    if (stagedShape.value) {
      callback(stagedShape.value);
    }
  });
};

//EXPORTS
export const dispatchers = {
  addImageToEngine,
  addVideoToEngine,
  addTextToEngine,
  addShapeToEngine,
};

export const events = {
  onGetStagedImage,
  onGetStagedVideo,
  onAddTextToEngine,
  onAddShapeToEngine,
};
