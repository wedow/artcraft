import { useState, useRef, useEffect, useContext } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { invoke } from "@tauri-apps/api/core";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import { uploadImage } from "~/components/reusable/UploadModalMedia/uploadImage";
import { downloadFileFromUrl } from "@storyteller/api";
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
  faMessageCheck,
  faMessageXmark,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangleWide,
  faRectangleVertical,
  faSquare,
  faRectangle,
  faTableCellsLarge,
} from "@fortawesome/pro-regular-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { PopoverItem, PopoverMenu } from "~/components/reusable/Popover";
import { Button, ToggleButton, Tooltip } from "~/components";
import { CameraAspectRatio } from "~/pages/PageEnigma/enums";

import {
  cameraAspectRatio,
  disableHotkeyInput,
  DomLevels,
  enableHotkeyInput,
  gridVisibility,
  setGridVisibility,
} from "~/pages/PageEnigma/signals";

import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { PromptsApi } from "@storyteller/api";
import { SoundRegistry } from "@storyteller/soundboard";
import { GetAppPreferences, SoraImageRemix } from "@storyteller/tauri-api";
import { CommandSuccessStatus } from "@storyteller/tauri-api";

import {
  cameras,
  selectedCameraId,
  addCamera,
  deleteCamera,
  updateCamera,
  focalLengthDragging,
} from "~/pages/PageEnigma/signals/camera";
import { toast } from "@storyteller/ui-toaster";
import { isPromptBoxFocused } from "~/pages/PageEnigma/signals/promptBox";

interface ReferenceImage {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
}

import { EngineApi } from "~/Classes/ApiManager/EngineApi";
import { UploaderStates } from "~/enums/UploaderStates";
import { CameraSettingsModal } from "../CameraSettingsModal";
import { twMerge } from "tailwind-merge";
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";
import { Modal } from "@storyteller/ui-modal";

export const PromptBox = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState<React.ReactNode>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [isEnqueueing, setisEnqueueing] = useState(false);
  const [useSystemPrompt, setUseSystemPrompt] = useState(true);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
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
  ]);
  const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [activeGalleryTab, setActiveGalleryTab] = useState("my-media");

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
    const selectedCamera = cameras.value.find(
      (cam) => cam.label === selectedItem.label,
    );
    if (selectedCamera && editorEngine) {
      selectedCameraId.value = selectedCamera.id;

      // Show focal length display temporarily
      // TODO: Rename dragging to visible - BFlat
      focalLengthDragging.value = {
        isDragging: true,
        focalLength: selectedCamera.focalLength,
      };
      setTimeout(() => {
        focalLengthDragging.value = {
          isDragging: false,
          focalLength: selectedCamera.focalLength,
        };
      }, 1500);

      // Update the main camera to match the selected camera's properties
      if (editorEngine.camera) {
        // First update position and lookAt
        editorEngine.camera.position.set(
          selectedCamera.position.x,
          selectedCamera.position.y,
          selectedCamera.position.z,
        );
        editorEngine.camera.lookAt(
          selectedCamera.lookAt.x,
          selectedCamera.lookAt.y,
          selectedCamera.lookAt.z,
        );

        // Update FOV
        editorEngine.camera.fov = editorEngine.focalLengthToFov(
          selectedCamera.focalLength,
        );
        editorEngine.camera.updateProjectionMatrix();

        // Reset and update camera controls
        if (editorEngine.cameraViewControls) {
          editorEngine.cameraViewControls.reset();
          editorEngine.cameraViewControls.update(0);
        }

        // Force a render to update the view
        editorEngine.renderScene();

        // Queue an update to ensure the engine processes the camera change
        // Queue.publish({
        //   queueName: QueueNames.TO_ENGINE,
        //   action: toEngineActions.CAMERA_CHANGED,
        //   data: selectedCamera,
        // });
      }

      // Force update camera properties in the state
      updateCamera(selectedCamera.id, {
        focalLength: selectedCamera.focalLength,
        position: selectedCamera.position,
        rotation: selectedCamera.rotation,
        lookAt: selectedCamera.lookAt,
      });
    }
  };

  const handleAddCamera = () => {
    // Check if we've reached the maximum number of cameras
    if (cameras.value.length >= 6) {
      console.warn("Maximum number of cameras (6) reached");
      return;
    }

    const newIndex = cameras.value.length + 1;
    const newId = `cam${newIndex}`;

    // This is for generating random orbital position for the new camera using spherical coordinates
    const radius = Math.random() * 5 + 7; // Distance from center: 7 to 12 units
    const theta = Math.random() * Math.PI * 2; // Azimuthal angle: 0 to 2π
    const phi = Math.PI / 3 + (Math.random() * Math.PI) / 6; // Polar angle: π/3 to π/2 (60° to 90° from horizontal)

    // Convert spherical coordinates to Cartesian coordinates
    const randomX = radius * Math.sin(phi) * Math.cos(theta);
    const randomY = Math.abs(radius * Math.cos(phi)) + 2; // Ensure Y is positive and at least 2 units up
    const randomZ = radius * Math.sin(phi) * Math.sin(theta);

    addCamera({
      id: newId,
      label: `Camera ${newIndex}`,
      focalLength: 24,
      position: {
        x: randomX,
        y: randomY,
        z: randomZ,
      },
      rotation: { x: 0, y: 0, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
    });

    // Switch to the newly created camera
    selectedCameraId.value = newId;

    // Update the engine camera to match the new camera's properties
    if (editorEngine && editorEngine.camera) {
      editorEngine.camera.position.set(randomX, randomY, randomZ);
      editorEngine.camera.lookAt(0, 0, 0);
      editorEngine.camera.fov = editorEngine.focalLengthToFov(24);
      editorEngine.camera.updateProjectionMatrix();

      // Reset and update camera controls
      if (editorEngine.cameraViewControls) {
        editorEngine.cameraViewControls.reset();
        editorEngine.cameraViewControls.update(0);
      }

      // Force a render to update the view
      editorEngine.renderScene();

      // Queue.publish({
      //   queueName: QueueNames.TO_ENGINE,
      //   action: toEngineActions.CAMERA_CHANGED,
      //   data: {
      //     id: newId,
      //     label: `Camera ${newIndex}`,
      //     focalLength: 24,
      //     position: { x: randomX, y: randomY, z: randomZ },
      //     rotation: { x: 0, y: 0, z: 0 },
      //     lookAt: { x: 0, y: 0, z: 0 },
      //   },
      // });
    }
  };

  const handleCameraNameChange = (id: string, newName: string) => {
    updateCamera(id, { label: newName });
  };

  const handleCameraFocalLengthChange = (id: string, value: number) => {
    const camera = cameras.value.find((cam) => cam.id === id);
    if (camera) {
      updateCamera(id, { focalLength: value });
    }
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

  const handleGallerySelect = () => {
    setIsGalleryModalOpen(true);
  };

  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((imageId) => imageId !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleGalleryImages = (selectedItems: GalleryItem[]) => {
    selectedItems.forEach((item) => {
      if (!item.fullImage) return;
      const referenceImage: ReferenceImage = {
        id: Math.random().toString(36).substring(7),
        url: item.fullImage,
        file: new File([], "gallery-image"),
        mediaToken: item.id,
      };
      setReferenceImages((prev) => [...prev, referenceImage]);
    });
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "upload":
        handleUploadClick();
        break;
      case "gallery":
        handleGallerySelect();
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

  const handleError = (errorMessage: string) => {
    setContent(errorMessage);
    setIsModalOpen(true);
  };

  const handleEnqueue = async () => {
    const isDesktop = IsDesktopApp();
    console.log("Is this a desktop app?", isDesktop);

    const r = SoundRegistry.getInstance();
    r.playSound("test");

    if (isDesktop) {
      await handleTauriEnqueue();
    } else {
      await handleWebEnqueue();
    }
  };

  const handleWebEnqueue = async () => {
    if (!prompt.trim()) return;

    setisEnqueueing(true);

    if (editorEngine) {
      editorEngine.positive_prompt = prompt;

      //const engineApi = new EngineApi();
      const promptsApi = new PromptsApi();

      const snapshot = editorEngine.snapShotOfCurrentFrame(false);

      if (snapshot) {
        const snapshotResult = await promptsApi.uploadSceneSnapshot({
          screenshot: snapshot.file,
          sceneMediaToken: "",
        });

        console.log("useSystemPrompt", useSystemPrompt);

        const response = await promptsApi.enqueueImageGeneration({
          disableSystemPrompt: !useSystemPrompt,
          prompt: prompt,
          snapshotMediaToken: snapshotResult.data || "",
          additionalImages: referenceImages.map((image) => image.mediaToken),
        });

        console.log("response", response);

        if (response.errorMessage) {
          handleError(response.errorMessage);
          setisEnqueueing(false);
          return;
        }
      }

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
        toast.success("Image added to queue");
      }
    }
    setisEnqueueing(false);
  };

  const handleTauriEnqueue = async () => {
    if (!prompt.trim()) return;

    setisEnqueueing(true);

    if (editorEngine) {
      editorEngine.positive_prompt = prompt;

      const promptsApi = new PromptsApi();

      const snapshot = editorEngine.snapShotOfCurrentFrame(false);

      if (snapshot) {
        const snapshotResult = await promptsApi.uploadSceneSnapshot({
          screenshot: snapshot.file,
          //sceneMediaToken: "",
        });

        console.log("snapshotResult", snapshotResult)

        const generateResponse = await SoraImageRemix({
          snapshot_media_token: snapshotResult.data!,
          disable_system_prompt: !useSystemPrompt,
          prompt: prompt,
          maybe_additional_images: referenceImages.map(
            (image) => image.mediaToken,
          ),
          maybe_number_of_samples: 1,
        });

        console.log("generateResponse", generateResponse)

        if (generateResponse.status === CommandSuccessStatus.Success) {
          const prefs = await GetAppPreferences();
          const soundName = prefs.preferences?.enqueue_success_sound;
          if (soundName !== undefined) {
            const registry = SoundRegistry.getInstance();
            registry.playSound(soundName);
          }
          toast.success("Image added to queue");
          setisEnqueueing(false);
          return;

        } else {
          const prefs = await GetAppPreferences();
          const soundName = prefs.preferences?.enqueue_failure_sound;
          if (soundName !== undefined) {
            const registry = SoundRegistry.getInstance();
            registry.playSound(soundName);
          }
          toast.error("Failed to enqueue image");
          setisEnqueueing(false);
          return;
        }

        // const generateResponse = await invoke("sora_image_remix_command", {
        //   request: {
        //     snapshot_media_token: snapshotResult.data!,
        //     disable_system_prompt: !useSystemPrompt,
        //     prompt: prompt,
        //     maybe_additional_images: referenceImages.map(
        //       (image) => image.mediaToken,
        //     ),
        //     maybe_number_of_samples: 1,
        //   },
        // });

        //if (generateResponse.errorMessage) {
        //  handleError(response.errorMessage);
        //  setisEnqueueing(false);
        //  return;
        //}
      }

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
        toast.success("Image added to queue");
      }
    }
    setisEnqueueing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleWebEnqueue();
    }
  };

  // Get the current aspect ratio icon based on the cameraAspectRatio signal
  const getCurrentAspectRatioIcon = () => {
    switch (cameraAspectRatio.value) {
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

  const handleSaveFrame = async () => {
    if (editorEngine) {
      const snapshot = editorEngine.snapShotOfCurrentFrame(false);
      if (snapshot) {
        const engineApi = new EngineApi();
        await engineApi.uploadSceneSnapshot({
          screenshot: snapshot.file || "",
          sceneMediaToken: "",
        });
      }
    }
  };

  const handleDownloadFrame = () => {
    if (editorEngine) {
      editorEngine.snapShotOfCurrentFrame(true);
    }
  };

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setContent("");
        }}
      >
        {content}
      </Modal>
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
        <div
          className={twMerge(
            "glass w-[730px] rounded-xl p-4",
            isPromptBoxFocused.value ? "!border !border-primary" : "",
          )}
        >
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
                  action: "gallery",
                },
              ]}
              onPanelAction={handleAction}
              showIconsInList
              buttonClassName="bg-transparent hover:bg-transparent py-1.5 px-0 pr-1 m-0 hover:opacity-50 transition-opacity duration-100 ring-0 border-none focus:ring-0 outline-none"
              triggerIcon={
                <FontAwesomeIcon icon={faPlus} className="text-xl" />
              }
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
              onFocus={() => {
                disableHotkeyInput(DomLevels.INPUT);
                isPromptBoxFocused.value = true;
              }}
              onBlur={() => {
                enableHotkeyInput(DomLevels.INPUT);
                isPromptBoxFocused.value = false;
              }}
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
              >
                <PopoverMenu
                  items={cameras.value.map((cam) => ({
                    id: cam.id,
                    label: cam.label,
                    selected: cam.id === selectedCameraId.value,
                    icon: (
                      <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                    ),
                    focalLength: cam.focalLength,
                    position: cam.position,
                    rotation: cam.rotation,
                    lookAt: cam.lookAt,
                  }))}
                  onSelect={handleCameraSelect}
                  onAdd={handleAddCamera}
                  triggerIcon={
                    <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                  }
                  showAddButton
                  disableAddButton={cameras.value.length >= 6}
                  showIconsInList
                  mode="toggle"
                  panelTitle="Camera"
                  panelActionLabel="Settings"
                  onPanelAction={() => setIsCameraSettingsOpen(true)}
                  buttonClassName="max-w-[130px] h-9"
                />
              </Tooltip>
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
              <Tooltip
                content={gridVisibility.value ? "Grid: ON" : "Grid: OFF"}
                position="top"
                className="z-50"
                delay={200}
              >
                <ToggleButton
                  isActive={gridVisibility.value}
                  icon={faTableCellsLarge}
                  activeIcon={faTableCellsLarge}
                  onClick={() => setGridVisibility(!gridVisibility.value)}
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
        <CameraSettingsModal
          isOpen={isCameraSettingsOpen}
          onClose={() => setIsCameraSettingsOpen(false)}
          cameras={cameras.value.map((cam) => ({
            id: cam.id,
            label: cam.label,
            selected: cam.id === selectedCameraId.value,
            icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
            focalLength: cam.focalLength,
            position: cam.position,
            rotation: cam.rotation,
            lookAt: cam.lookAt,
          }))}
          onCameraNameChange={handleCameraNameChange}
          onCameraFocalLengthChange={handleCameraFocalLengthChange}
          onAddCamera={handleAddCamera}
          selectedCameraId={selectedCameraId.value}
          handleCameraSelect={handleCameraSelect}
          onDeleteCamera={deleteCamera}
        />
      </div>
      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={4}
        onUseSelected={handleGalleryImages}
        tabs={[
          { id: "my-media", label: "My generations" },
          { id: "uploads", label: "My uploads" },
        ]}
        activeTab={activeGalleryTab}
        onTabChange={setActiveGalleryTab}
        onDownloadClicked={downloadFileFromUrl}
      />
    </>
  );
};
