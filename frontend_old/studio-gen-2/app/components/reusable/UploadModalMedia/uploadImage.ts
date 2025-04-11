import { v4 as uuidv4 } from "uuid";
import { MediaUploadApi } from "~/Classes/ApiManager";
import { UploaderStates } from "~/enums";
import { UploaderState } from "~/models";
import { getFileName } from "~/utilities";

export const uploadImage = async ({
  title,
  assetFile,
  progressCallback,
}: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => {
  const mediaUploadApi = new MediaUploadApi();

  progressCallback({ status: UploaderStates.uploadingImage });

  const imageResponse = await mediaUploadApi.UploadImage({
    uuid: uuidv4(),
    blob: assetFile,
    fileName: getFileName(assetFile),
    maybe_title: "char_frame_" + title,
  });

  if (imageResponse == undefined) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: "Could not upload image!",
    });
    return;
  }

  if (!imageResponse.success || !imageResponse.data) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: imageResponse.errorMessage,
    });
    return;
  }

  progressCallback({ status: UploaderStates.success, data: imageResponse.data });
};
