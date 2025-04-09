import { useCallback } from "react";
import { Signal } from "@preact/signals-react";
import { v4 as uuidv4 } from "uuid";

import { MediaUploadApi, MediaFilesApi } from "~/Classes/ApiManager";
import { TrimData } from "./TrimmerPlaybar";
import { DialogAddMediaStatuses } from "./enums";
import { Button } from "~/components/ui";

import { ApiResponse } from "~/Classes/ApiManager/ApiManager";
import { MediaFile } from "~/Classes/ApiManager/models/MediaFile";

export const ButtonSubmitAdd = ({
  file,
  trimData,
  onStatusChanged,
  onUploadedVideo,
  retry,
}: {
  file: File | null;
  trimData: Signal<TrimData | undefined>;
  onStatusChanged: (newStatus: DialogAddMediaStatuses) => void;
  onUploadedVideo: (response: ApiResponse<MediaFile>) => void;
  retry?: boolean;
}) => {
  const handleAdd = useCallback(async () => {
    if (file && trimData.value) {
      // setup payload
      const payload = {
        blob: file,
        fileName: file.name,
        uuid: uuidv4(),
        is_intermediate_system_file: false,
        maybe_trim_start_millis: Math.round(trimData.value.trimStartMs),
        maybe_trim_end_millis: Math.round(trimData.value.trimEndMs),
      };
      console.log("Add Video Payload >> ", payload);

      // upload the file
      onStatusChanged(DialogAddMediaStatuses.FILE_UPLOADING);
      const meaidaUpload = new MediaUploadApi();
      const fileUploadResponse = await meaidaUpload.UploadNewVideo(payload);
      console.log("Add Video Response >> ", fileUploadResponse);

      // if upload fails
      if (!fileUploadResponse.success || !fileUploadResponse.data) {
        onStatusChanged(DialogAddMediaStatuses.ERROR_FILE_UPLOAD);
        return;
      }

      // request the file record
      onStatusChanged(DialogAddMediaStatuses.FILE_RECORD_REQUESTING);
      const mediaFiles = new MediaFilesApi();
      const recordRequestResponse = await mediaFiles.GetMediaFileByToken({
        mediaFileToken: fileUploadResponse.data,
      });

      // if reqest fails
      if (!recordRequestResponse.success || !recordRequestResponse.data) {
        onStatusChanged(DialogAddMediaStatuses.ERROR_FILE_RECORD_REQUEST);
        return;
      }

      // return the good result
      onStatusChanged(DialogAddMediaStatuses.FILE_RECORD_RECEIVED);
      console.log("Request Video Response >>", recordRequestResponse);
      onUploadedVideo(recordRequestResponse);
    }
  }, [file]);

  return (
    <Button
      onClick={handleAdd}
      disabled={file === null || trimData === undefined}
    >
      {retry ? "Retry Add" : "Add Video"}
    </Button>
  );
};
