import { GetFileExtension } from "./GetFileExtension";

// We only list supported file types
export enum FileType {
  // Audio
  Mp3 = "mp3",
  Wav = "wav",

  // Images
  Jpeg = "jpeg",
  Jpg = "jpg",
  Png = "png",

  // Video
  Mp4 = "mp4",

  // 3D
  Bvh = "bvh",
  Fbx = "fbx",
  Glb = "glb",
  Gltf = "gltf",
  Obj = "obj",
  Ron = "ron",
  Pmd = "pmd",
  Vmd = "vmd",
  Pmx = "pmx",

  // Unknown or unsupported
  Unknown = "unknown",
}

const FILE_TYPE_MAP: Record<string, FileType> = {
  bvh: FileType.Bvh,
  fbx: FileType.Fbx,
  glb: FileType.Glb,
  gltf: FileType.Gltf,
  jpeg: FileType.Jpeg,
  jpg: FileType.Jpg,
  mp3: FileType.Mp3,
  mp4: FileType.Mp4,
  obj: FileType.Obj,
  png: FileType.Png,
  ron: FileType.Ron,
  wav: FileType.Wav,
  pmd: FileType.Pmd,
  vmd: FileType.Vmd,
  pmx: FileType.Pmx,

  // TODO: This is temporary
  zip: FileType.Pmx,
};

export function GetFileTypeByExtension(filename: string): FileType {
  const extension = GetFileExtension(filename).toLocaleLowerCase();
  return FILE_TYPE_MAP[extension] || FileType.Unknown;
}
