import { useState } from "react";
import { useFile } from "hooks";
import { v4 as uuidv4 } from "uuid";
import {
  isSelectedType,
  MediaFilters,
  UploaderResponse,
} from "components/entities/EntityTypes";
import { UploadAudioMedia } from "@storyteller/components/src/api/media_files/UploadAudioMedia";
import { UploadImageMedia } from "@storyteller/components/src/api/media_files/UploadImageMedia";
import { UploadVideoMedia } from "@storyteller/components/src/api/media_files/UploadVideoMedia";
import { UploadEngineAsset } from "@storyteller/components/src/api/media_files/UploadEngineAsset";
import { MediaFileSubtype } from "@storyteller/components/src/api/enums/MediaFileSubtype";
import { GetFileTypeByExtension as extension } from "@storyteller/components/src/utils/GetFileTypeByExtension";
import { MediaFileClass } from "@storyteller/components/src/api/enums/MediaFileClass";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";

interface Props {
  autoUpload?: boolean;
  onError?: (res: UploaderResponse) => any;
  onSuccess?: (res: UploaderResponse) => any;
}

const n = () => { };

export default function useMediaUploader({ autoUpload, onError = n, onSuccess = n }: Props) {
  const [status, statusSet] = useState(FetchStatus.ready);
  const [mediaClass, mediaClassSet] = useState<MediaFileClass>(
    MediaFileClass.Unknown
  );
  const [engineSubtype, engineSubtypeSet] = useState<
    MediaFileSubtype | undefined
  >();
  const [uploadProgress, uploadProgressSet] = useState(0);

  const { file, clear, inputProps } = useFile({
    ...(autoUpload
      ? {
        onChange: (inputFile: File) => {
          if (inputFile) createUpload(inputFile, clear);
        },
      }
      : {}),
  });

  const createUpload = (inputFile: File, todo = n) => {
    statusSet(FetchStatus.in_progress);
    const fileExtension = extension(inputFile.name || "");
    const isAudio = isSelectedType(MediaFilters.audio, fileExtension);
    const isEngineAsset = isSelectedType(
      MediaFilters.engine_asset,
      fileExtension
    );
    const isImage = isSelectedType(MediaFilters.image, fileExtension);
    // const isVideo = isSelectedType(MediaFilters.video, fileExtension);
    const baseConfig = { uuid_idempotency_token: uuidv4(), file: inputFile };
    const engineConfig = {
      ...baseConfig,
      media_file_subtype: engineSubtype,
      media_file_class: mediaClass,
    };
    const mediaConfig = { ...baseConfig, source: "file" };

    const uploader = () => {
      if (isAudio) return UploadAudioMedia(mediaConfig);
      if (isEngineAsset) return UploadEngineAsset(engineConfig);
      if (isImage) return UploadImageMedia(mediaConfig);
      else
        return UploadVideoMedia(mediaConfig, uploadEvent =>
          uploadProgressSet(
            Math.round((uploadEvent.loaded * 100) / (uploadEvent?.total || 0))
          )
        );
    };

    if (inputFile) {
      uploader().then((res: UploaderResponse) => {
        if ("media_file_token" in res) {
          statusSet(FetchStatus.success);
          onSuccess(res);
          todo();
        } else {
          onError(res);
          statusSet(FetchStatus.error);
        }
      });
    }
  };

  const upload = () => {
    createUpload(file, clear);
  };

  const engineSubtypeChange = ({ target }: { target: any }) =>
    engineSubtypeSet(target.value);

  const mediaClassChange = ({ target }: { target: any }) =>
    mediaClassSet(target.value);

  return {
    busy: status === FetchStatus.in_progress,
    clear,
    createUpload,
    engineSubtype,
    engineSubtypeChange,
    error: status === FetchStatus.error,
    mediaClass,
    mediaClassChange,
    file,
    inputProps,
    isAudio: isSelectedType(MediaFilters.audio, extension(file?.name || "")),
    isEngineAsset: isSelectedType(
      MediaFilters.engine_asset,
      extension(file?.name || "")
    ),
    isImage: isSelectedType(MediaFilters.image, extension(file?.name || "")),
    isVideo: isSelectedType(MediaFilters.video, extension(file?.name || "")),
    reset: () => {
      clear();
      statusSet(FetchStatus.ready);
    },
    status,
    upload,
    uploadProgress,
  };
}
