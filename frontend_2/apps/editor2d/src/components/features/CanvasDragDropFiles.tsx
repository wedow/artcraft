import {
  DragEventHandler,
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import { faFilePlus } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

interface CanvasDragDropFilesInterface extends HTMLAttributes<HTMLDivElement> {
  fileTypes: string[];
  onSetFiles: (file: File[]) => void;
}
enum DragStates {
  IDLE = "idle",
  READY = "ready",
  DRAGGING = "dragging",
}
export const CanvasDragDropFiles = ({
  fileTypes,
  onSetFiles,
  className,
}: CanvasDragDropFilesInterface) => {
  const [dragging, setDragging] = useState<DragStates>(DragStates.IDLE);
  const lastDragging = useRef<DragStates>(DragStates.IDLE);

  const handleDrop: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    if (!event.dataTransfer) {
      return;
    }
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const newFiles = Array.from(droppedFiles) as File[];
      onSetFiles(newFiles);
      setDragging(DragStates.READY);
    }
  };
  const handleDragOver: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setDragging((curr) => {
      if (!event.dataTransfer) {
        return curr;
      }
      if (curr !== DragStates.DRAGGING) {
        lastDragging.current = curr;
      }
      return DragStates.DRAGGING;
    });
  };

  const handleDragExit: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setDragging(lastDragging.current);
  };

  useEffect(() => {
    const mouseLeaveHandler = () => {
      setDragging(DragStates.READY);
    };
    const mouseEnterHandler = () => {
      setDragging((curr) => {
        if (curr === DragStates.DRAGGING) {
          return curr;
        }
        return DragStates.IDLE;
      });
    };

    document.addEventListener("mouseleave", mouseLeaveHandler);
    document.addEventListener("mouseenter", mouseEnterHandler);

    return () => {
      document.removeEventListener("mouseleave", mouseLeaveHandler);
      document.removeEventListener("mouseenter", mouseEnterHandler);
    };
  }, []);
  return (
    <div
      className={twMerge(
        "h-full w-full rounded-2xl border-4 border-dashed border-transparent bg-transparent",
        dragging === DragStates.IDLE && "pointer-events-none",
        dragging === DragStates.DRAGGING && "border-gray-200 bg-gray-700/50",
        "relative",
        className,
      )}
      onDrop={handleDrop}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragExit={handleDragExit}
      onDragLeave={handleDragExit}
    >
      {dragging === DragStates.DRAGGING && (
        <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center gap-4 text-white">
          <FontAwesomeIcon icon={faFilePlus} className="text-5xl" />
          <p className="mt-1 text-lg">
            Drag and drop files here to add them to the board!
          </p>
          <p className="text-lg">
            Acceptable file types:{" "}
            <b>
              {fileTypes.reduce((acc, curr, idx) => {
                const prefix = curr[0] !== "." ? "." : "";
                const suffix = idx === fileTypes.length - 1 ? "" : ", ";
                return acc + prefix + curr.toUpperCase() + suffix;
              }, "")}
            </b>
          </p>
        </div>
      )}
    </div>
  );
};
