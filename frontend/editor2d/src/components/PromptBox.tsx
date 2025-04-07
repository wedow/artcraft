import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  UploaderStates,
  UploaderState,
  uploadImage,
} from "~/components/UploadImage";

import { PopoverMenu } from "~/components/reusable/Popover";
import { Tooltip } from "~/components/reusable/Tooltip";
import { Button } from "~/components/reusable/Button";
import { ToggleButton } from "~/components/reusable/ToggleButton";

import {
  faCamera,
  faMessageXmark,
  faMessageCheck,
  faDownload,
  faSave,
  faSparkles,
  faSpinnerThird,
  faTimes,
  faPlus,
  faUpload,
  faImages,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangleWide,
  faRectangleVertical,
  faSquare,
  faRectangle,
} from "@fortawesome/pro-regular-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverItem } from "~/components/reusable/Popover";

interface ReferenceImage {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
}

interface ExtendedPopoverItem extends PopoverItem {
  id: string;
  focalLength: number;
}

export const PromptBox = () => {
  useSignals();
  const [prompt, setPrompt] = useState("");
  const [isEnqueueing, setisEnqueueing] = useState(false);
  const [useSystemPrompt, setUseSystemPrompt] = useState(true);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
  const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState(false);
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
  const [cameraList, setCameraList] = useState<ExtendedPopoverItem[]>([
    {
      id: "main",
      label: "Main View",
      selected: true,
      icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
      focalLength: 35,
    },
    {
      id: "cam2",
      label: "Camera 2",
      selected: false,
      icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
      focalLength: 35,
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
    setAspectRatioList((prev) => prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCameraSelect = (selectedItem: PopoverItem) => {};

  const handleAddCamera = () => {
    const newIndex = cameraList.length + 1;
    const newId = `cam${newIndex}`;
    setCameraList((prev) => [
      ...prev,
      {
        id: newId,
        label: `Camera ${newIndex}`,
        selected: false,
        icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
        focalLength: 35,
      },
    ]);
  };

  const handleCameraNameChange = (id: string, newName: string) => {
    setCameraList((prev) =>
      prev.map((cam) => (cam.id === id ? { ...cam, label: newName } : cam)),
    );
  };

  const handleCameraFocalLengthChange = (id: string, value: number) => {
    setCameraList((prev) =>
      prev.map((cam) => (cam.id === id ? { ...cam, focalLength: value } : cam)),
    );
  };

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      })),
    );

    // Map the selected label to the corresponding CameraAspectRatio enum value

    // Publish the change to the engine
    // Queue.publish({
    //   queueName: QueueNames.TO_ENGINE,
    //   action: toEngineActions.CHANGE_CAMERA_ASPECT_RATIO,
    //   data: newRatio,
    // });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const uploadId = Math.random().toString(36).substring(7);
        setUploadingImages((prev) => [...prev, { id: uploadId, file }]);

        const reader = new FileReader();
        reader.onloadend = () => {
          uploadImage({
            title: `reference-image-${Math.random().toString(36).substring(2, 15)}`,
            assetFile: file,
            progressCallback: (newState) => {
              console.debug("Upload progress:", newState.data);
              if (newState.status === UploaderStates.success && newState.data) {
                const referenceImage: ReferenceImage = {
                  id: Math.random().toString(36).substring(7),
                  url: reader.result as string,
                  file,
                  mediaToken: newState.data || "",
                };
                setReferenceImages((prev) => [...prev, referenceImage]);
                setUploadingImages((prev) =>
                  prev.filter((img) => img.id !== uploadId),
                );
                console.log("Reference image added:", referenceImage);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                setUploadingImages((prev) =>
                  prev.filter((img) => img.id !== uploadId),
                );
                console.error("Upload failed");
              }
            },
          });
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

  // Get the current aspect ratio icon based on the cameraAspectRatio signal
  const getCurrentAspectRatioIcon = () => {};

  const handleSaveFrame = async () => {};

  const handleDownloadFrame = () => {};

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnqueue();
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col gap-3">
      {(referenceImages.length > 0 || uploadingImages.length > 0) && (
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
          {uploadingImages.map(({ id, file }) => {
            const previewUrl = URL.createObjectURL(file);
            return (
              <div
                key={id}
                className="glass relative aspect-square w-20 overflow-hidden rounded-lg"
              >
                <div className="absolute inset-0">
                  <img
                    src={previewUrl}
                    alt="Uploading preview"
                    className="h-full w-full object-cover blur-sm"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    className="h-6 w-6 animate-spin text-white"
                  />
                </div>
              </div>
            );
          })}
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
            onPanelAction={handleAction}
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
            onFocus={() => {}}
            onBlur={() => {}}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tooltip
              content="Aspect ratio"
              position="top"
              className="z-50"
              closeOnClick={true}
            >
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
            </Tooltip>
            <Tooltip
              content="Camera"
              position="top"
              className="z-50"
              delay={300}
              closeOnClick={true}
            ></Tooltip>
            <Tooltip
              content={
                useSystemPrompt
                  ? "Use system prompt: ON"
                  : "Use system prompt: OFF"
              }
              position="top"
              className="z-50"
              delay={200}
            >
              <ToggleButton
                isActive={useSystemPrompt}
                icon={faMessageXmark}
                activeIcon={faMessageCheck}
                onClick={() => setUseSystemPrompt(!useSystemPrompt)}
              />
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip
              content="Download frame"
              position="top"
              className="z-50"
              closeOnClick={true}
              delay={200}
            >
              <Button
                className="flex h-9 items-center border-none bg-[#5F5F68]/60 px-3 text-sm text-white backdrop-blur-lg hover:bg-[#5F5F68]/90"
                variant="secondary"
                icon={faDownload}
                onClick={handleDownloadFrame}
              />
            </Tooltip>

            <Button
              className="flex items-center border-none bg-[#5F5F68]/60 px-3 text-sm text-white backdrop-blur-lg hover:bg-[#5F5F68]/90"
              variant="secondary"
              icon={faSave}
              onClick={handleSaveFrame}
            >
              Save frame
            </Button>
            <Button
              className="bg-brand-primary flex items-center border-none px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
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
