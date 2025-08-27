import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { JobContextType } from "@storyteller/common";
import { downloadFileFromUrl } from "@storyteller/api";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import {
  EnqueueTextToImage,
  EnqueueTextToImageSize,
} from "@storyteller/tauri-api";
import {
  faMessageXmark,
  faMessageCheck,
  faSparkles,
  faSpinnerThird,
  faTimes,
  faPlus,
  faImages,
  faCopy,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangle,
  faSquare,
  faRectangleVertical,
} from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { ImageModel, ModelInfo, getCapabilitiesForModel } from "@storyteller/model-list";
import { usePromptImageStore, RefImage } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";

interface PromptBoxImageProps {
  useJobContext: () => JobContextType;
  onEnqueuePressed?: (
    prompt: string,
    count: number,
    subscriberId: string
  ) => void | Promise<void>;
  selectedModel?: ImageModel;
  imageMediaId?: string;
  url?: string;
}

export const PromptBoxImage = ({
  useJobContext,
  onEnqueuePressed,
  selectedModel,
  imageMediaId,
  url,
}: PromptBoxImageProps) => {
  useSignals();

  // for the image media id and url, we need to set the reference image gallery panel.
  useEffect(() => {
    if (imageMediaId && url) {
      const referenceImage: RefImage = {
        id: Math.random().toString(36).substring(7),
        url: url,
        file: new File([], "library-image"),
        mediaToken: imageMediaId,
      };
      setReferenceImages([referenceImage]);
    }
  }, [imageMediaId, url]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState("");

  const prompt = usePromptImageStore((s) => s.prompt);
  const setPrompt = usePromptImageStore((s) => s.setPrompt);
  const useSystemPrompt = usePromptImageStore((s) => s.useSystemPrompt);
  const setUseSystemPrompt = usePromptImageStore((s) => s.setUseSystemPrompt);
  const aspectRatio = usePromptImageStore((s) => s.aspectRatio);
  const setAspectRatio = usePromptImageStore((s) => s.setAspectRatio);
  const generationCount = usePromptImageStore((s) => s.generationCount);
  const setGenerationCount = usePromptImageStore((s) => s.setGenerationCount);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    []
  );
  const referenceImages = usePromptImageStore((s) => s.referenceImages);
  const setReferenceImages = usePromptImageStore((s) => s.setReferenceImages);
  const [uploadingImages, _setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
  const [aspectRatioList, setAspectRatioList] = useState<PopoverItem[]>([
    {
      label: "3:2",
      selected: aspectRatio === "3:2",
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
    {
      label: "2:3",
      selected: aspectRatio === "2:3",
      icon: <FontAwesomeIcon icon={faRectangleVertical} className="h-4 w-4" />,
    },
    {
      label: "1:1",
      selected: aspectRatio === "1:1",
      icon: <FontAwesomeIcon icon={faSquare} className="h-4 w-4" />,
    },
  ]);
  const [generationCountList, setGenerationCountList] = useState<PopoverItem[]>(
    []
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (imageMediaId && url) {
      const referenceImage: RefImage = {
        id: Math.random().toString(36).substring(7),
        url: url,
        file: new File([], "library-image"),
        mediaToken: imageMediaId,
      };
      setReferenceImages([referenceImage]);
    }
  }, [imageMediaId, url]);

  useEffect(() => {
    // Build generation count options based on selected model
    const caps = getCapabilitiesForModel(selectedModel);
    const defaultCount = Math.min(
      Math.max(1, caps.defaultGenerationCount ?? 1),
      caps.maxGenerationCount
    );

    setGenerationCount(defaultCount);

    const items: PopoverItem[] = Array.from(
      { length: caps.maxGenerationCount },
      (_, i) => i + 1
    ).map((count) => ({
      label: String(count),
      selected: count === defaultCount,
      icon: <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />,
    }));
    setGenerationCountList(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  useEffect(() => {
    setGenerationCountList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === String(generationCount),
      }))
    );
  }, [generationCount]);

  useEffect(() => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === aspectRatio,
      }))
    );
  }, [aspectRatio]);

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatio(selectedItem.label as any);
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      }))
    );
  };

  const handleGenerationCountSelect = (selectedItem: PopoverItem) => {
    const count = parseInt(selectedItem.label, 10);
    setGenerationCount(count);
    setGenerationCountList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      }))
    );
  };

  const handleRemoveReference = (id: string) => {
    setReferenceImages(referenceImages.filter((img) => img.id !== id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  const handleGallerySelect = () => setIsGalleryModalOpen(true);
  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) {
        return [];
      }
      return [id];
    });
  };

  const handleGalleryImages = (selectedItems: GalleryItem[]) => {
    // Clear existing reference images first
    setReferenceImages([]);

    // Only take the first selected item
    const item = selectedItems[0];
    if (!item || !item.fullImage) return;

    const referenceImage: RefImage = {
      id: Math.random().toString(36).substring(7),
      url: item.fullImage,
      file: new File([], "library-image"),
      mediaToken: item.id,
    };
    setReferenceImages([referenceImage]);
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "gallery":
        handleGallerySelect();
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next =
      value.slice(0, selectionStart) + pastedText + value.slice(selectionEnd);
    setPrompt(next);
    requestAnimationFrame(() => {
      const pos = selectionStart + pastedText.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleEnqueue = async () => {
    setIsEnqueueing(true);

    gtagEvent("enqueue_image");

    const subscriberId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    onEnqueuePressed?.(prompt, generationCount, subscriberId);

    setTimeout(() => {
      // TODO(bt,2025-05-08): This is a hack so we don't accidentally wind up with a permanently disabled prompt box if
      // the backend hangs on a given request.
      console.debug("Turn off blocking of prompt box...");
      setIsEnqueueing(false);
    }, 10000);

    const aspectRatio = getCurrentAspectRatio();

    const generateResponse = await EnqueueTextToImage({
      prompt: prompt,
      model: selectedModel,
      aspect_ratio: aspectRatio,
      number_images: generationCount,
      frontend_caller: "text_to_image",
      frontend_subscriber_id: subscriberId,
    });

    console.log("PromptBoxImage - generateResponse", generateResponse);

    setIsEnqueueing(false);
  };

  const getCurrentResolutionIcon = () => {
    const selected = aspectRatioList.find((item) => item.selected);
    if (!selected || !selected.icon) return faRectangle;
    const iconElement = selected.icon as React.ReactElement<{ icon: IconProp }>;
    return iconElement.props.icon;
  };

  const getCurrentAspectRatio = (): EnqueueTextToImageSize => {
    const selected = aspectRatioList.find((item) => item.selected);
    switch (selected?.label) {
      case "3:2":
        return EnqueueTextToImageSize.Wide;
      case "2:3":
        return EnqueueTextToImageSize.Tall;
      case "1:1":
      default:
        return EnqueueTextToImageSize.Square;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnqueue();
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
      <div className="relative z-20 flex flex-col gap-3">
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
          <div className="flex justify-center gap-2">
            <PopoverMenu
              mode="button"
              panelTitle="Add Image"
              items={[
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
              placeholder="Choose the image from library (+) and describe what you want to happen in the video..."
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
                content="Aspect Ratio"
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
                      icon={getCurrentResolutionIcon()}
                      className="h-4 w-4"
                    />
                  }
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
            </div>
            <div className="flex items-center gap-2">
              <Tooltip
                content="Number of generations"
                position="top"
                className="z-50"
                closeOnClick={true}
              >
                <PopoverMenu
                  items={generationCountList}
                  onSelect={handleGenerationCountSelect}
                  mode="toggle"
                  triggerIcon={
                    <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />
                  }
                  panelClassName="min-w-28"
                  panelTitle="No. of images"
                  buttonClassName="h-9"
                />
              </Tooltip>
              <Button
                className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
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
      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={1}
        onUseSelected={handleGalleryImages}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
