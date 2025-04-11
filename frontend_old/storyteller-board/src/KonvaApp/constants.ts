export enum AppModes {
  INIT = "INIT",
  PREVIEW = "PREVIEW",
  SELECT = "SELECT",
  RENDERING = "RENDERING",
}

export const VideoResolutions = {
  VERTICAL_720: { width: 720, height: 1280 },
  LANDSCAPE_720: { width: 1280, height: 720 },
};

export const Colors = {
  transparent: "rgba(0,0,0,0)",
  translucentBlack: "rgba(0,0,0,0.3)",
  primaryOrange: "rgba(230,100,98,1)",
};
