import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { animated, useSpring } from "@react-spring/web";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faPlus,
  faPlay,
  faSpinnerThird,
  faXmark,
  faChevronDown,
  faChevronUp,
  faSlidersUp,
  faWandMagicSparkles,
  faVideo,
  faUser,
  faUpload,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import { uploadImage } from "../../components/reusable/UploadModalMedia/uploadImage";
import {
  useMotionControlStore,
  VideoQuality,
  MotionVideo,
  CharacterImage,
} from "./MotionControlStore";
import { UploaderState, UploaderStates } from "@storyteller/common";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { EnqueueMotionControl } from "@storyteller/tauri-api";
import { toast } from "react-hot-toast";

// Tab options
const QUALITY_TABS = [
  { id: "480p", label: "480p" },
  { id: "720p", label: "720p" },
  { id: "1080p", label: "1080p" },
];

const SCENE_CONTROL_TABS = [
  { id: "video", label: "Video" },
  { id: "image", label: "Image" },
];

const ORIENTATION_TABS = [
  { id: "video", label: "Video" },
  { id: "image", label: "Image" },
];

const MotionControl = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const promptContentRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState<number>(400);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isUploadingMotion, setIsUploadingMotion] = useState(false);
  const [isUploadingCharacter, setIsUploadingCharacter] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<"motion" | "character">(
    "character",
  );
  const motionInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );

  // Store state
  const motionVideo = useMotionControlStore((s) => s.motionVideo);
  const characterImage = useMotionControlStore((s) => s.characterImage);
  const quality = useMotionControlStore((s) => s.quality);
  const sceneControlMode = useMotionControlStore((s) => s.sceneControlMode);
  const prompt = useMotionControlStore((s) => s.prompt);
  const orientation = useMotionControlStore((s) => s.orientation);
  const batches = useMotionControlStore((s) => s.batches);
  const setMotionVideo = useMotionControlStore((s) => s.setMotionVideo);
  const setCharacterImage = useMotionControlStore((s) => s.setCharacterImage);
  const setQuality = useMotionControlStore((s) => s.setQuality);
  const setSceneControlMode = useMotionControlStore(
    (s) => s.setSceneControlMode,
  );
  const setPrompt = useMotionControlStore((s) => s.setPrompt);
  const setOrientation = useMotionControlStore((s) => s.setOrientation);
  const startBatch = useMotionControlStore((s) => s.startBatch);
  const resetBatches = useMotionControlStore((s) => s.reset);

  const hasAnyBatches = batches.length > 0;
  const showPromptAtBottom = useMemo(() => hasAnyBatches, [hasAnyBatches]);

  const [vh, setVh] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 800,
  );

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = promptContentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bottomMarginPx = 24;
  const bottomOffsetPx = promptHeight + bottomMarginPx;

  // Center the panel vertically (accounting for prompt height)
  const centerTop = vh / 2 - promptHeight / 2 + 80;
  const bottomTop = vh - bottomOffsetPx;

  const targetTop = showPromptAtBottom
    ? Math.max(0, bottomTop)
    : Math.max(0, centerTop);

  const promptAnim = useSpring({
    top: targetTop,
    config: { tension: 200, friction: 28, mass: 1.1 },
  });

  const inverseBatch = [...batches].reverse();

  // Handle motion video upload
  const handleMotionUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploadingMotion(true);
      const uploadId = Math.random().toString(36).substring(7);
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          await uploadImage({
            title: `motion-video-${uploadId}`,
            assetFile: file,
            progressCallback: (newState: UploaderState) => {
              if (newState.status === UploaderStates.success && newState.data) {
                const videoData: MotionVideo = {
                  id: uploadId,
                  url: reader.result as string,
                  file,
                  mediaToken: newState.data,
                };
                setMotionVideo(videoData);
                setIsUploadingMotion(false);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                setIsUploadingMotion(false);
              }
            },
          });
        } catch (error) {
          console.error("Failed to upload motion video:", error);
          setIsUploadingMotion(false);
        }
      };
      reader.readAsDataURL(file);
      if (motionInputRef.current) motionInputRef.current.value = "";
    },
    [setMotionVideo],
  );

  // Handle character image upload
  const handleCharacterUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploadingCharacter(true);
      const uploadId = Math.random().toString(36).substring(7);
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          await uploadImage({
            title: `character-image-${uploadId}`,
            assetFile: file,
            progressCallback: (newState: UploaderState) => {
              if (newState.status === UploaderStates.success && newState.data) {
                const imageData: CharacterImage = {
                  id: uploadId,
                  url: reader.result as string,
                  file,
                  mediaToken: newState.data,
                };
                setCharacterImage(imageData);
                setIsUploadingCharacter(false);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                setIsUploadingCharacter(false);
              }
            },
          });
        } catch (error) {
          console.error("Failed to upload character image:", error);
          setIsUploadingCharacter(false);
        }
      };
      reader.readAsDataURL(file);
      if (characterInputRef.current) characterInputRef.current.value = "";
    },
    [setCharacterImage],
  );

  // Handle gallery close
  const handleGalleryClose = () => {
    setIsGalleryOpen(false);
    setSelectedGalleryImages([]);
  };

  // Handle gallery image selection
  const handleGalleryImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [id]; // Single selection for motion control
    });
  };

  // Handle gallery selection
  const handleGallerySelect = (items: GalleryItem[]) => {
    if (items.length === 0) return;
    const item = items[0];

    if (galleryTarget === "motion" && item.fullImage) {
      // For videos from library
      const videoData: MotionVideo = {
        id: Math.random().toString(36).substring(7),
        url: item.fullImage,
        file: new File([], "library-video"),
        mediaToken: item.id,
      };
      setMotionVideo(videoData);
    } else if (galleryTarget === "character" && item.fullImage) {
      const imageData: CharacterImage = {
        id: Math.random().toString(36).substring(7),
        url: item.fullImage,
        file: new File([], "library-image"),
        mediaToken: item.id,
      };
      setCharacterImage(imageData);
    }
    handleGalleryClose();
  };

  // Handle generate
  const handleGenerate = async () => {
    if (!motionVideo || !characterImage) return;
    if (!motionVideo.mediaToken || !characterImage.mediaToken) {
      toast.error("Media tokens are missing. Please re-upload your files.");
      return;
    }

    const subscriberId = crypto?.randomUUID?.() ?? `motion-${Date.now()}`;
    startBatch(prompt, subscriberId);

    try {
      const result = await EnqueueMotionControl({
        image_media_token: characterImage.mediaToken,
        video_media_token: motionVideo.mediaToken,
        character_orientation: orientation,
        prompt: prompt || undefined,
        keep_original_sound: true,
        frontend_caller: "mini_app",
        frontend_subscriber_id: subscriberId,
      });

      if ("error_type" in result) {
        throw new Error(result.error_message || result.error_type);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(`Motion control failed: ${errorMessage}`);
    }
  };

  const canGenerate = motionVideo && characterImage;

  const backgroundImage = "/resources/images/floating-cubes.png";

  return (
    <div
      ref={containerRef}
      className="bg-ui-panel-gradient flex h-[calc(100vh-56px)] w-full bg-ui-panel text-base-fg"
    >
      {/* Background image */}
      {backgroundImage && !hasAnyBatches && (
        <>
          <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[radial-gradient(50%_50%_at_50%_50%,_transparent_49%,_rgb(var(--st-controls-rgb)_/_var(--st-gallery-vignette-alpha))_100%)]" />
          <div className="fixed inset-0 z-0 overflow-hidden">
            <div
              className="h-full w-full opacity-30 transition-opacity duration-1000"
              style={{
                backgroundImage: `linear-gradient(0deg, rgb(var(--st-photo-tint-rgb) / var(--st-photo-tint-alpha)), rgb(var(--st-photo-tint-rgb) / var(--st-photo-tint-alpha))), url(${backgroundImage})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "grayscale(var(--st-photo-grayscale))",
              }}
            />
          </div>
        </>
      )}

      <div className="relative z-10 h-full w-full p-8">
        {/* Title when no batches */}
        {!showPromptAtBottom && (
          <div className="pointer-events-none absolute left-0 top-[calc(50%-320px)] w-full text-center">
            <h1 className="mb-3 text-7xl font-bold tracking-tight">
              Motion Control
            </h1>
            <p className="text-xl text-base-fg/70">
              Copy motion from any video and apply it to your character
            </p>
          </div>
        )}

        {/* Generation results */}
        {hasAnyBatches && (
          <div
            className="h-full w-full overflow-y-auto"
            style={{ paddingBottom: bottomOffsetPx + 24 }}
          >
            <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 pr-2">
              {inverseBatch.map((batch) => (
                <div key={batch.id} className="flex items-start gap-4">
                  <div className="grid flex-1 grid-cols-1 gap-4">
                    {batch.status === "pending" && !batch.generatedVideo ? (
                      <div className="aspect-video w-full max-w-2xl animate-pulse rounded-lg bg-white/5" />
                    ) : batch.generatedVideo ? (
                      <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg">
                        <video
                          className="h-full w-full object-cover"
                          src={batch.generatedVideo.cdn_url}
                          controls
                        />
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <div className="glass inline-block w-[280px] shrink-0 rounded-xl px-4 py-3 text-left text-sm text-base-fg/90">
                      <div className="mb-2 font-medium">Inputs:</div>
                      <div className="mb-2 flex gap-2">
                        {batch.motionVideo && (
                          <div className="h-12 w-12 overflow-hidden rounded bg-white/10">
                            <video
                              src={batch.motionVideo.url}
                              className="h-full w-full object-cover"
                              muted
                            />
                          </div>
                        )}
                        {batch.characterImage && (
                          <img
                            src={batch.characterImage.url}
                            className="h-12 w-12 rounded object-cover"
                            alt="Character"
                          />
                        )}
                      </div>
                      {batch.prompt && (
                        <div className="text-xs text-base-fg/70">
                          {batch.prompt}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main input panel - centered approach */}
        <animated.div
          className="fixed left-1/2 z-20 -translate-x-1/2"
          style={{ ...promptAnim, width: "min(820px, calc(100vw - 64px))" }}
        >
          {showPromptAtBottom && batches.length > 0 && (
            <div className="absolute -top-9 flex w-full justify-end">
              <button
                onClick={() => resetBatches()}
                className="rounded-md bg-red/20 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-red/30"
              >
                Clear session
              </button>
            </div>
          )}

          <div
            ref={promptContentRef}
            className="glass rounded-2xl shadow-2xl ring-1 ring-white/10"
          >
            {/* Input areas - side by side */}
            <div
              className={twMerge(
                "grid grid-cols-2 gap-4",
                hasAnyBatches ? "p-3" : "p-5",
              )}
            >
              {/* Motion Video Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-base-fg/80">
                  <FontAwesomeIcon icon={faVideo} className="h-3.5 w-3.5" />
                  <span>Motion Reference</span>
                  <span className="text-xs text-base-fg/50">(3-30s video)</span>
                </div>
                <input
                  type="file"
                  ref={motionInputRef}
                  className="hidden"
                  accept="video/*"
                  onChange={handleMotionUpload}
                />
                {motionVideo ? (
                  <div
                    className={twMerge(
                      "group relative overflow-hidden rounded-xl border-2 border-white/20 bg-black/20",
                      hasAnyBatches ? "aspect-[2/1]" : "aspect-video",
                    )}
                  >
                    <video
                      src={motionVideo.url}
                      className="h-full w-full object-contain"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                    <button
                      onClick={() => setMotionVideo(null)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-colors hover:bg-red/70 group-hover:opacity-100"
                    >
                      <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white/80">
                      <FontAwesomeIcon icon={faPlay} className="h-2 w-2" />
                      Motion
                    </div>
                  </div>
                ) : isUploadingMotion ? (
                  <div
                    className={twMerge(
                      "flex items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5",
                      hasAnyBatches ? "aspect-[2/1]" : "aspect-video",
                    )}
                  >
                    <FontAwesomeIcon
                      icon={faSpinnerThird}
                      className="h-6 w-6 animate-spin text-base-fg/50"
                    />
                  </div>
                ) : (
                  <Tooltip
                    interactive
                    position="top"
                    className="border border-ui-panel-border bg-ui-controls p-2 text-base-fg"
                    content={
                      <div className="flex flex-col gap-1.5">
                        <Button
                          variant="primary"
                          onClick={() => motionInputRef.current?.click()}
                          icon={faUpload}
                          className="w-full"
                        >
                          Upload
                        </Button>
                        <Button
                          variant="action"
                          onClick={() => {
                            setGalleryTarget("motion");
                            setIsGalleryOpen(true);
                          }}
                          icon={faVideo}
                          className="w-full"
                        >
                          Pick from library
                        </Button>
                      </div>
                    }
                  >
                    <button
                      onClick={() => motionInputRef.current?.click()}
                      className={twMerge(
                        "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-white/5 transition-all hover:border-white/30 hover:bg-white/10",
                        hasAnyBatches ? "aspect-[2/1]" : "aspect-video",
                      )}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        <FontAwesomeIcon
                          icon={faPlus}
                          className="text-xl text-base-fg/70"
                        />
                      </div>
                      <span className="text-sm text-base-fg/60">
                        Add motion video
                      </span>
                      <span className="text-xs text-base-fg/40">
                        Video duration: 3-30 seconds
                      </span>
                    </button>
                  </Tooltip>
                )}
              </div>

              {/* Character Image Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-base-fg/80">
                  <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5" />
                  <span>Your Character</span>
                  <span className="text-xs text-base-fg/50">
                    (visible face & body)
                  </span>
                </div>
                <input
                  type="file"
                  ref={characterInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleCharacterUpload}
                />
                {characterImage ? (
                  <div
                    className={twMerge(
                      "group relative overflow-hidden rounded-xl border-2 border-white/20 bg-black/20",
                      hasAnyBatches ? "aspect-[2/1]" : "aspect-video",
                    )}
                  >
                    <img
                      src={characterImage.url}
                      alt="Character"
                      className="h-full w-full object-contain"
                    />
                    <button
                      onClick={() => setCharacterImage(null)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-colors hover:bg-red/70 group-hover:opacity-100"
                    >
                      <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white/80">
                      <FontAwesomeIcon icon={faImage} className="h-2 w-2" />
                      Character
                    </div>
                  </div>
                ) : isUploadingCharacter ? (
                  <div
                    className={twMerge(
                      "flex items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5",
                      hasAnyBatches ? "aspect-[2/1]" : "aspect-video",
                    )}
                  >
                    <FontAwesomeIcon
                      icon={faSpinnerThird}
                      className="h-6 w-6 animate-spin text-base-fg/50"
                    />
                  </div>
                ) : (
                  <Tooltip
                    interactive
                    position="top"
                    className="border border-ui-panel-border bg-ui-controls p-2 text-base-fg"
                    content={
                      <div className="flex flex-col gap-1.5">
                        <Button
                          variant="primary"
                          onClick={() => characterInputRef.current?.click()}
                          icon={faPlus}
                          className="w-full"
                        >
                          Upload
                        </Button>
                        <Button
                          variant="action"
                          onClick={() => {
                            setGalleryTarget("character");
                            setIsGalleryOpen(true);
                          }}
                          icon={faImage}
                          className="w-full"
                        >
                          Pick from library
                        </Button>
                      </div>
                    }
                  >
                    <button
                      onClick={() => characterInputRef.current?.click()}
                      className={twMerge(
                        "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-white/5 transition-all hover:border-white/30 hover:bg-white/10",
                        hasAnyBatches ? "aspect-[2/1]" : "aspect-video",
                      )}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        <FontAwesomeIcon
                          icon={faPlus}
                          className="text-xl text-base-fg/70"
                        />
                      </div>
                      <span className="text-sm text-base-fg/60">
                        Add character image
                      </span>
                      <span className="text-xs text-base-fg/40">
                        Image with visible face and body
                      </span>
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Settings Row */}
            <div className="flex items-center gap-4 border-t border-white/10 px-5 py-3">
              {/* Quality Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-base-fg/60">Quality</span>
                <TabSelector
                  tabs={QUALITY_TABS}
                  activeTab={quality}
                  onTabChange={(tabId) => setQuality(tabId as VideoQuality)}
                  className="w-fit"
                  indicatorClassName="bg-primary/25"
                />
              </div>

              {/* Scene Control Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-base-fg/60">Scene control</span>
                <TabSelector
                  tabs={SCENE_CONTROL_TABS}
                  activeTab={sceneControlMode}
                  onTabChange={(tabId) =>
                    setSceneControlMode(tabId as "video" | "image")
                  }
                  className="w-fit"
                  indicatorClassName="bg-primary/25"
                />
              </div>

              <div className="flex-1" />

              {/* Advanced Settings Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-base-fg/60 transition-colors hover:text-base-fg"
              >
                <FontAwesomeIcon icon={faSlidersUp} className="h-3.5 w-3.5" />
                Advanced
                <FontAwesomeIcon
                  icon={showAdvanced ? faChevronUp : faChevronDown}
                  className="h-2.5 w-2.5"
                />
              </button>
            </div>

            {/* Advanced Settings Panel */}
            {showAdvanced && (
              <div className="space-y-4 border-t border-white/10 px-5 py-4">
                {/* Prompt */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-base-fg/80">
                    Scene Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the background and scene details – e.g., 'A corgi runs in' or 'Snowy park setting'. Motion is controlled by your reference video."
                    className="h-20 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-base-fg placeholder:text-base-fg/40 focus:border-primary/50 focus:outline-none"
                  />
                </div>

                {/* Orientation */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-base-fg/80">
                    Orientation
                  </span>
                  <TabSelector
                    tabs={ORIENTATION_TABS}
                    activeTab={orientation}
                    onTabChange={(tabId) =>
                      setOrientation(tabId as "video" | "image")
                    }
                    className="w-fit"
                    indicatorClassName="bg-white/20"
                  />
                  <span className="text-xs text-base-fg/40">
                    {orientation === "video"
                      ? "When orientation matches video, character motions perform better"
                      : "When it matches the image, camera movements are better supported"}
                  </span>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="border-t border-white/10 px-5 py-4">
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={!canGenerate}
                icon={faWandMagicSparkles}
                className={twMerge(
                  "h-12 w-full text-base font-semibold shadow-lg transition-all",
                  canGenerate
                    ? "shadow-primary-500/30 hover:shadow-primary-500/50"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                Generate
              </Button>
              {!canGenerate && (
                <p className="mt-2 text-center text-xs text-base-fg/40">
                  Add both a motion video and character image to generate
                </p>
              )}
            </div>
          </div>
        </animated.div>

        {/* Help Button */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <HelpMenuButton />
        </div>
      </div>

      {/* Gallery Modal */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleGalleryImageSelect}
        maxSelections={1}
        onUseSelected={handleGallerySelect}
        forceFilter={galleryTarget === "motion" ? "video" : "image"}
      />
    </div>
  );
};

export default MotionControl;
