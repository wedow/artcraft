export enum AppModes {
  INIT = "INIT",
  PREVIEW = "PREVIEW",
  SELECT = "SELECT",
  PAINT = "PAINT",
  ERASER = "ERASER",
  RENDERING = "RENDERING",
}

export const VideoResolutions = {
  VERTICAL_720: { width: 720, height: 1280 },
  LANDSCAPE_720: { width: 1280, height: 720 },
  SQUARE_1024: { width: 1024, height: 1024 },
};

export const Colors = {
  transparent: "rgba(0,0,0,0)",
  translucentBlack: "rgba(0,0,0,0.3)",
  primaryOrange: "rgba(45, 129, 255, 1)",
};
