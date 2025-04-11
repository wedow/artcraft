export const featureFlags = {
  videoTools: false, // Set to false to disable video features
};

// Function to check if video tools are enabled
export const isVideoToolsEnabled = () => featureFlags.videoTools;

export const videoRoutes = [
  "/style-video",
  "/ai-live-portrait",
  "/face-animator",
  "/webcam-acting",
  "/ai-face-mirror",
  "/live-portrait",
  "/dev-lp",
];

// Function to check if a path is a video tool route
export const isVideoRoute = (path: string) => {
  return videoRoutes.some(route => path.includes(route));
};
