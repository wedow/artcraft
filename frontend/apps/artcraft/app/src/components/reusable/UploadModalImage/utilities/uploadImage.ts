import { v4 as uuidv4 } from "uuid";
import { MediaUploadApi } from "../../../../Classes/ApiManager";
import { UploaderStates } from "../../../../enums";
import { UploaderState } from "../../../../models";
import { getFileName } from "../../../../utilities";
import { EIntermediateFile } from "~/enums/EIntermediateFile";

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

  console.log("Uploading image plane:", assetFile);

  progressCallback({ status: UploaderStates.uploadingAsset });

  const assetResponse = await mediaUploadApi.UploadImage({
    blob: assetFile,
    fileName: getFileName(assetFile),
    uuid: uuidv4(),
    maybe_title: title,
    is_intermediate_system_file: EIntermediateFile.false,
  });

  console.log("Image plane response:", assetResponse);

  if (assetResponse == undefined) {
    console.log("Error: Could not upload image plane!");
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: "Could not upload image plane!",
    });
    return;
  }

  if (!assetResponse.success || !assetResponse.data) {
    console.log("Error:", assetResponse.errorMessage);
    progressCallback({
      status: UploaderStates.assetError,
      errorMessage: assetResponse.errorMessage,
    });
    return;
  }

  console.log("Upload successful:", assetResponse.data);
  progressCallback({
    status: UploaderStates.success,
    data: assetResponse.data,
  });
};
