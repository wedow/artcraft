import { MediaFileType } from "@storyteller/components/src/api/_common/enums/MediaFileType";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";

export function GetMediaFileTitle(mediaFile?: MediaFile): string {
  if (mediaFile === undefined) {
    return "Untitled file";
  }

  let mediaType = undefined;

  switch (mediaFile?.media_type) {
    case MediaFileType.Audio:
    case MediaFileType.Video:
    case MediaFileType.Image:
      mediaType = mediaFile?.media_type.toLocaleLowerCase();
      break;
    case MediaFileType.BVH:
    case MediaFileType.GLTF:
    case MediaFileType.GLB:
    case MediaFileType.FBX:
      mediaType = mediaFile?.media_type.toUpperCase();
      break;
    case MediaFileType.SceneRon:
      mediaType = "RON";
      break;
  }

  let title = "";

  if (!!mediaFile?.maybe_title) {
    title = mediaFile?.maybe_title;
  } else if (!!mediaFile?.maybe_original_filename) {
    title = mediaFile?.maybe_original_filename;
  } else if (!!mediaFile?.maybe_model_weight_info?.title) {
    title = mediaFile?.maybe_model_weight_info?.title;
  } else if (!!mediaType) {
    title = `Untitled ${mediaType} file`;
  } else {
    title = "Untitled file";
  }

  if (title.length < 4) {
    const maybeSuffix = !!mediaType ? ` (${mediaType} file)` : "";
    return `${title}${maybeSuffix}`;
  } else {
    return title;
  }
}
