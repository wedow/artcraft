import { faFileArrowUp, faFileAudio } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { P } from "~/components";

export const DragAndDropZone = ({
  file,
  fileTypes,
}: {
  file?: File;
  fileTypes: string[];
}) => {
  if (!file) {
    return (
      <div className="flex cursor-pointer items-center gap-3.5 rounded-lg border border-dashed border-[#363636] bg-brand-secondary p-3">
        <FontAwesomeIcon icon={faFileArrowUp} className="text-4xl" />
        <div className="flex flex-col gap-0">
          <P className="font-medium">
            <u>Upload a file</u> or drop it here
          </P>

          <P className="flex items-center gap-2 text-sm font-normal opacity-50">
            {fileTypes.join(", ").toString()} supported
          </P>
        </div>
      </div>
    );
  }

  const fileName = file.name.split(".")[0].toUpperCase();
  const fileSize =
    file.size >= 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(2) + " MB"
      : `${Math.floor(file.size / 1024)} KB`;

  return (
    <div className="flex cursor-pointer items-center justify-between gap-3.5 rounded-lg border border-dashed border-[#363636] bg-brand-secondary p-3">
      <FontAwesomeIcon icon={faFileAudio} className="text-4xl" />
      <div className="flex grow flex-col gap-0">
        <P className="font-medium">
          {file.name.slice(0, file.name.lastIndexOf("."))}
        </P>
        <P className="flex items-center gap-2 text-sm font-normal">
          <span className="opacity-50">
            {`${fileName} file size: ${fileSize} `}
          </span>
          <u className="transition-all hover:text-white/80">Change File</u>
        </P>
      </div>
    </div>
  );
};
