export const apiHost = "https://api.storyteller.ai";

// Upload File
export const uploadMedia = `${apiHost}/v1/media_files/upload`;

// Scenes
export const uploadNewScene = `${apiHost}/v1/media_files/upload/new_scene`;
export const uploadThumbnail = `${apiHost}/v1/media_files/cover_image/`;
export const updateExistingScene = (sceneToken: string) =>
  `${apiHost}/v1/media_files/upload/saved_scene/${sceneToken}`;
