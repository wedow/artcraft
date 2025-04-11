import { MediaFileType } from "@storyteller/components/src/api/_common/enums/MediaFileType";

// THESE SHOULD BECOME A TRANSLATION STRINGS -- REPLACE LATER
export const mediaTypeLabels = {
  [MediaFileType.Audio]: "Audio",
  [MediaFileType.Video]: "Video",
  [MediaFileType.Image]: "Image",
  [MediaFileType.BVH]: "BVH",
  [MediaFileType.Gif]: "gif",
  [MediaFileType.GLB]: "GLB",
  [MediaFileType.GLTF]: "glTF",
  [MediaFileType.Jpg]: "jpg",
  [MediaFileType.Mp3]: "mp3",
  [MediaFileType.Mp4]: "mp4",
  [MediaFileType.Pmd]: "PMD",
  [MediaFileType.Pmx]: "PMX",
  [MediaFileType.Png]: "png",
  [MediaFileType.SceneRon]: "RON",
  [MediaFileType.SceneJson]: "Scene",
  [MediaFileType.FBX]: "FBX",
  [MediaFileType.Vmd]: "Expression", // TODO(bt,2024-05-09): This is a hack. ARKit are mistakenly vmd
  [MediaFileType.Wav]: "WAV",
  [MediaFileType.None]: "Unknown",
};
