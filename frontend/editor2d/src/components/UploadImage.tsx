import { v4 as uuidv4 } from "uuid";
import { MediaUploadApi } from "~/Classes/ApiManager";

import { getFileName } from "~/utilities";

export enum UploaderStates {
  ready,
  uploadingAsset,
  uploadingImage,
  uploadingCover,
  settingCover,
  success,
  assetError,
  coverCreateError,
  coverSetError,
  imageCreateError,
}

export interface UploaderState {
  status: UploaderStates;
  errorMessage?: string;
  data?: string;
}

export const initialUploaderState = {
  status: UploaderStates.ready,
};

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

  console.log("Uploading image:", assetFile);

  progressCallback({ status: UploaderStates.uploadingImage });

  const imageResponse = await mediaUploadApi.UploadImage({
    uuid: uuidv4(),
    blob: assetFile,
    fileName: getFileName(assetFile),
    maybe_title: "char_frame_" + title,
  });

  console.log("Image response:", imageResponse);

  if (imageResponse == undefined) {
    console.log("Error: Could not upload image!");
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: "Could not upload image!",
    });
    return;
  }

  if (!imageResponse.success || !imageResponse.data) {
    console.log("Error:", imageResponse.errorMessage);
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: imageResponse.errorMessage,
    });
    return;
  }

  console.log("Upload successful:", imageResponse.data);
  progressCallback({
    status: UploaderStates.success,
    data: imageResponse.data,
  });
};
