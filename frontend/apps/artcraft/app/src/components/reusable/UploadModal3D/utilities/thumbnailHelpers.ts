import { MediaFilesApi, MediaUploadApi } from "~/Classes/ApiManager";
import { v4 as uuidv4 } from "uuid";

import { getFileName } from "~/utilities";

export const snapshotCanvasAsThumbnail = async ({
  targetNode,
  resultCallback,
}: {
  targetNode: HTMLCanvasElement | undefined;
  resultCallback: (blob: Blob | undefined) => void;
}) => {
  if (!targetNode) {
    //TODO: Verbose Error
    return undefined;
  }
  targetNode.toBlob((blob: Blob | null) => {
    resultCallback(blob || undefined);
  });
};

export const uploadSnapshotAsThumbnail = async ({
  assetTitle = "unknown_asset",
  blob,
}: {
  assetTitle?: string;
  blob: Blob;
}) => {
  const thumbnailFile = new File([blob], "storyteller-cap.png");

  const thumbnailTitle = "thumbnail_" + assetTitle;

  const mediaUploadApi = new MediaUploadApi();
  return await mediaUploadApi.UploadImage({
    uuid: uuidv4(),
    blob: thumbnailFile,
    fileName: getFileName(thumbnailFile),
    maybe_title: thumbnailTitle,
  });
};

export const setThumbnail = async ({
  assetToken,
  thumbnailToken,
}: {
  assetToken: string;
  thumbnailToken: string;
}) => {
  const mediaFilesApi = new MediaFilesApi();
  return await mediaFilesApi.UpdateCoverImage({
    mediaFileToken: assetToken,
    imageToken: thumbnailToken,
  });
};
