import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import {
  faFileArrowUp,
  faFileImage,
  faFileVideo,
} from "@fortawesome/pro-solid-svg-icons";

import { VIDEO_FILE_TYPE } from "~/constants/fileTypeEnums";
// import { getFileName } from "~/utilities";

interface Props {
  file: File | null;
  fileTypes: string[];
}

export const DragAndDropZone = ({ file, fileTypes }: Props) => {
  const fileSize =
    file && file.size >= 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(2) + " MB"
      : file
        ? `${Math.floor(file.size / 1024)} KB`
        : null;

  // const fileName = file && getFileName(file).toUpperCase();
  const wrapperClassName = twMerge(
    "group cursor-pointer px-6 py-12 bg-gray-100 hover:bg-gray-200/60 transition-colors duration-150 ease-in-out",
    !file && "flex flex-col items-center justify-center gap-",
    file && "flex items-center gap-2 py-6",
    // "rounded-lg border-2 border-dashed border-ui-border",
  );

  if (!file) {
    return (
      <div className={wrapperClassName}>
        <FontAwesomeIcon
          icon={faFileArrowUp}
          className="mb-3 text-5xl opacity-50"
        />
        <p className="text-xl font-semibold">
          <u>Upload a file</u> or drop it here
        </p>
        <p className="text-md mt-1.5 flex items-center gap-1 font-normal opacity-70">
          Supported file types:{" "}
          <b>{fileTypes.join(", ").toString().toUpperCase()}</b>
        </p>
      </div>
    );
  } else {
    const icon = fileTypes.includes(Object.values(VIDEO_FILE_TYPE)[0])
      ? faFileVideo
      : faFileImage;
    return (
      <div className={wrapperClassName}>
        <FontAwesomeIcon icon={icon} className="mr-2 text-4xl opacity-70" />
        <div className="flex grow flex-col gap-0">
          <p className="font-medium">
            {file.name.slice(0, file.name.lastIndexOf("."))}
          </p>
          <p className="flex items-center gap-2 text-sm font-normal text-gray-500">
            {`file size: ${fileSize} `}
          </p>
        </div>
        <div className="rounded-md bg-primary px-4 py-2 hover:bg-primary-400">
          <p className="font-normal text-white">Change File</p>
        </div>
      </div>
    );
  }
};
