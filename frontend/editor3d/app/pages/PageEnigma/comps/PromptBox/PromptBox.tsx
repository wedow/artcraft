import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";

import {
  faPlus,
  faCamera,
  faSave,
  faSparkles,
  faUpload,
  faImages,
  faDownload,
  faSpinnerThird,
  faTimes,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangleWide,
  faRectangleVertical,
  faSquare,
  faRectangle,
} from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverItem, PopoverMenu } from "~/components/reusable/Popover";
import { Button } from "~/components";
import { CameraAspectRatio } from "~/pages/PageEnigma/enums";
import { cameraAspectRatio } from "~/pages/PageEnigma/signals";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";

interface ReferenceImage {
  id: string;
  url: string;
  file: File;
}

export const PromptBox = () => {
  useSignals();
  const [prompt, setPrompt] = useState("");
  const [isEnqueueing, setisEnqueueing] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [aspectRatioList, setAspectRatioList] = useState<PopoverItem[]>([
    {
      label: "3:2",
      selected: true,
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
    {
      label: "2:3",
      selected: false,
      icon: <FontAwesomeIcon icon={faRectangleVertical} className="h-4 w-4" />,
    },
    {
      label: "1:1",
      selected: false,
      icon: <FontAwesomeIcon icon={faSquare} className="h-4 w-4" />,
    },
    {
      label: "16:9",
      selected: false,
      icon: <FontAwesomeIcon icon={faRectangleWide} className="h-4 w-4" />,
    },
  ]);
  const [cameraList, setCameraList] = useState<PopoverItem[]>([
    {
      label: "Main View",
      selected: true,
      icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
    },
    {
      label: "Camera 2",
      selected: false,
      icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Update aspect ratio list based on the current cameraAspectRatio signal
  useEffect(() => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected:
          (item.label === "16:9" &&
            cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9) ||
          (item.label === "3:2" &&
            cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_3_2) ||
          (item.label === "2:3" &&
            cameraAspectRatio.value === CameraAspectRatio.VERTICAL_2_3) ||
          (item.label === "1:1" &&
            cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraAspectRatio.value]);

  const handleCameraSelect = (selectedItem: PopoverItem) => {
    setCameraList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      })),
    );
  };

  const handleAddCamera = () => {
    const newIndex = cameraList.length + 1;
    setCameraList((prev) => [
      ...prev,
      {
        label: `Camera ${newIndex}`,
        selected: false,
        icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
      },
    ]);
  };

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      })),
    );

    // Map the selected label to the corresponding CameraAspectRatio enum value
    let newRatio: CameraAspectRatio;
    switch (selectedItem.label) {
      case "16:9":
        newRatio = CameraAspectRatio.HORIZONTAL_16_9;
        break;
      case "3:2":
        newRatio = CameraAspectRatio.HORIZONTAL_3_2;
        break;
      case "2:3":
        newRatio = CameraAspectRatio.VERTICAL_2_3;
        break;
      case "1:1":
        newRatio = CameraAspectRatio.SQUARE_1_1;
        break;
      default:
        newRatio = CameraAspectRatio.HORIZONTAL_16_9;
    }

    // Publish the change to the engine
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.CHANGE_CAMERA_ASPECT_RATIO,
      data: newRatio,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReferenceImages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              url: reader.result as string,
              file,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveReference = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLibrarySelect = () => {
    console.log("Opening library selector");
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "upload":
        handleUploadClick();
        break;
      case "library":
        handleLibrarySelect();
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").trim();
    setPrompt(pastedText);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleEnqueue = async () => {
    if (!prompt.trim()) return;

    setisEnqueueing(true);
    try {
      // Here we would pass both the prompt and reference images to the generation
      console.log(
        "Enqueuing with prompt:",
        prompt,
        "and reference images:",
        referenceImages,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setisEnqueueing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnqueue();
    }
  };

  // Get the current aspect ratio icon based on the cameraAspectRatio signal
  const getCurrentAspectRatioIcon = () => {
    switch (cameraAspectRatio.value) {
      case CameraAspectRatio.HORIZONTAL_16_9:
        return faRectangleWide;
      case CameraAspectRatio.HORIZONTAL_3_2:
        return faRectangle;
      case CameraAspectRatio.VERTICAL_2_3:
        return faRectangleVertical;
      case CameraAspectRatio.VERTICAL_9_16:
        return faRectangleVertical;
      case CameraAspectRatio.SQUARE_1_1:
        return faSquare;
      default:
        return faRectangleWide;
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col gap-3">
      {referenceImages.length > 0 && (
        <div className="flex w-full gap-2">
          {referenceImages.map((image) => (
            <div
              key={image.id}
              className="glass relative aspect-square w-20 rounded-lg"
            >
              <img
                src={image.url}
                alt="Reference"
                className="h-full w-full rounded-lg object-cover"
              />
              <button
                onClick={() => handleRemoveReference(image.id)}
                className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black"
              >
                <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="glass w-[730px] rounded-xl p-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
          multiple
        />
        <div className="flex justify-center gap-2">
          <PopoverMenu
            mode="button"
            panelTitle="Add Image"
            items={[
              {
                label: "Upload from device",
                selected: false,
                icon: <FontAwesomeIcon icon={faUpload} className="h-4 w-4" />,
                action: "upload",
              },
              {
                label: "Choose from library",
                selected: false,
                icon: <FontAwesomeIcon icon={faImages} className="h-4 w-4" />,
                action: "library",
                disabled: true,
              },
            ]}
            onAction={handleAction}
            showIconsInList
            buttonClassName="backdrop-blur-none bg-transparent hover:bg-transparent py-1.5 px-0 pr-1 m-0 hover:opacity-50 transition-opacity duration-100 ring-0 border-none focus:ring-0 outline-none"
            triggerIcon={<FontAwesomeIcon icon={faPlus} className="text-xl" />}
          />

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Describe your image..."
            className="text-md mb-2 max-h-[5.5em] flex-1 resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-white placeholder-white placeholder:text-white/60 focus:outline-none"
            value={prompt}
            onChange={handleChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PopoverMenu
              items={aspectRatioList}
              onSelect={handleAspectRatioSelect}
              mode="toggle"
              panelTitle="Aspect Ratio"
              showIconsInList
              triggerIcon={
                <FontAwesomeIcon
                  icon={getCurrentAspectRatioIcon()}
                  className="h-4 w-4"
                />
              }
            />
            <PopoverMenu
              items={cameraList}
              onSelect={handleCameraSelect}
              onAdd={handleAddCamera}
              triggerIcon={
                <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
              }
              showAddButton
              showIconsInList
              mode="toggle"
              panelTitle="Camera"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center border-none bg-[#5F5F68]/60 px-3 text-sm text-white backdrop-blur-lg hover:bg-[#5F5F68]/90"
              variant="secondary"
              icon={faDownload}
            >
              Download frame
            </Button>
            <Button
              className="flex items-center border-none bg-[#5F5F68]/60 px-3 text-sm text-white backdrop-blur-lg hover:bg-[#5F5F68]/90"
              variant="secondary"
              icon={faSave}
            >
              Save frame
            </Button>
            <Button
              className="flex items-center border-none bg-brand-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              icon={!isEnqueueing ? faSparkles : undefined}
              onClick={handleEnqueue}
              disabled={isEnqueueing || !prompt.trim()}
            >
              {isEnqueueing ? (
                <FontAwesomeIcon
                  icon={faSpinnerThird}
                  className="animate-spin text-lg"
                />
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
