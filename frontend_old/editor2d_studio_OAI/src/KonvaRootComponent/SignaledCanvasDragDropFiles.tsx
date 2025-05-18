import { useCallback } from "react";

import { CanvasDragDropFiles } from "~/components/features";
import { uiAccess } from "~/signals";

// global signals

import { getFileExtension } from "~/utilities";

// enums
import { IMAGE_FILE_TYPE, VIDEO_FILE_TYPE } from "~/constants/fileTypeEnums";

export const SignaledCanvasDragDropFiles = ({
  openAddImage,
  openAddVideo,
}: {
  openAddImage: (file?: File) => void;
  openAddVideo: (file?: File) => void;
}) => {
  // const [files, setFiles] = useState<File[]>([]);
  const imageFileTypes = Object.values(IMAGE_FILE_TYPE) as string[];
  const videoFileTypes = Object.values(VIDEO_FILE_TYPE) as string[];
  const fileTypes = [...imageFileTypes, ...videoFileTypes];
  const onSetFiles = useCallback((files: File[]) => {
    if (files.length < 0) {
      return;
    }
    if (files.length > 1) {
      uiAccess.dialogueError.show({
        title: "Error in Adding files",
        message:
          "Sorry, we don't support adding multiple files at once, yet! it's coming soon.",
      });
      return;
    }
    const file = files[0];
    const fileExt = getFileExtension(file);
    if (imageFileTypes.includes(fileExt)) {
      openAddImage(file);
      return;
    }
    if (videoFileTypes.includes(fileExt)) {
      openAddVideo(file);
      return;
    }
    uiAccess.dialogueError.show({
      title: "Error in Adding files",
      message: `Sorry, we do not support this file type: .${fileExt.toUpperCase()}`,
    });
    return;
  }, []);
  return (
    <CanvasDragDropFiles
      className="col-span-12 col-start-1 row-span-11 row-start-1"
      onSetFiles={onSetFiles}
      fileTypes={fileTypes}
    />
  );
};
