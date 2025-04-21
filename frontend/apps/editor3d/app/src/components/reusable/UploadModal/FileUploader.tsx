import { FileUploader as DragDropFilesUploader } from "react-drag-drop-files";
import { DragAndDropZone } from "./DragAndDropZone";
import { Label } from "../Typography";

interface Props {
  title: string;
  fileTypes: string[];
  file: File | null;
  setFile: (file: File | null) => void;
}

export const FileUploader = ({ fileTypes, title, file, setFile }: Props) => {
  return (
    <div className="flex w-full flex-col">
      <Label required>{title}</Label>
      <DragDropFilesUploader
        handleChange={(file: File | null) => {
          setFile(file);
        }}
        name="file"
        types={fileTypes}
        maxSize={50}
      >
        <DragAndDropZone file={file} fileTypes={fileTypes} />
      </DragDropFilesUploader>
    </div>
  );
};
