import { MediaFilesApi, MediaUploadApi } from "~/Classes/ApiManager";
import { FilterEngineCategories, MediaFileAnimationType } from "~/enums";
import { getFileExtension } from "~/utilities";
import { v4 as uuidv4 } from "uuid";

export const uploadAsset = async ({
  file,
  title,
  engineCategory,
  animationType,
}: {
  file: File;
  title: string;
  engineCategory: FilterEngineCategories;
  animationType?: MediaFileAnimationType;
}) => {
  // TODO: 'media_uploads' is the name of an ancient table nothing writes to. We shouldn't use this name here to mean the media_files table.
  const mediaUploadApi = new MediaUploadApi();
  const mediaFileApi = new MediaFilesApi();

  const fileExtension = getFileExtension(file);

  const assetReponse = await (async () => {
    switch (fileExtension) {
      case ".spz":
        console.log("Uploading asset as SPZ");
        return mediaFileApi.UploadSpzFile({
          file: file,
          fileName: file.name,
          uuid: uuidv4(),
          maybe_title: title,
        });
      case ".zip":
        console.log("Uploading asset as PMX");
        return mediaUploadApi.UploadPmx({
          file: file,
          fileName: file.name,
          engine_category: engineCategory,
          maybe_title: title,
          maybe_animation_type: animationType,
          uuid: uuidv4(),
        });
      default:
        console.log("Uploading asset as generic engine asset");
        return mediaUploadApi.UploadNewEngineAsset({
          file: file,
          fileName: file.name,
          engine_category: engineCategory,
          maybe_title: title,
          maybe_animation_type: animationType,
          uuid: uuidv4(),
        });
    }
  })();

  return assetReponse;
};
