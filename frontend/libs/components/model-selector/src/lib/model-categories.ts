/**
 * Defines the unique categories for each product or context where a model
 * selection is required. Using an enum prevents typos and ensures type safety.
 */
export enum ModelCategory {
  TextToImage = "text-to-image",
  ImageToVideo = "image-to-video",
  Canvas2D = "2d-canvas",
  Editor3D = "3d-editor",
}
