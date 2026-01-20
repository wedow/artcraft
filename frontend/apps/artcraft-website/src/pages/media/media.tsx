import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Button } from "@storyteller/ui-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { toast } from "@storyteller/ui-toaster";
import { MediaFilesApi, PromptsApi, UserInfo } from "@storyteller/api";
import { Gravatar } from "@storyteller/ui-gravatar";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faLink,
  faCheck,
  faArrowDownToLine,
  faPencil,
  faCircleInfo,
  faImage,
  faUser,
} from "@fortawesome/pro-solid-svg-icons";
import {
  addCorsParam,
  getContextImageThumbnail,
  THUMBNAIL_SIZES,
  PLACEHOLDER_IMAGES,
} from "@storyteller/common";
import {
  getModelCreatorIcon,
  getModelDisplayName,
  getProviderDisplayName,
  getProviderIconByName,
} from "@storyteller/model-list";
import Seo from "../../components/seo";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
const COPY_FEEDBACK_DURATION = 1500;
const SHARE_URL_BASE = "https://getartcraft.com/media/";

const isVideoUrl = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => urlLower.includes(ext));
};

interface ContextImage {
  media_links: { cdn_url: string; maybe_thumbnail_template: string };
  media_token: string;
  semantic: string;
}

interface MediaData {
  url: string | null;
  token: string | null;
  createdAt: string | null;
  isVideo: boolean;
  isLoaded: boolean;
  width?: number;
  height?: number;
  creator: UserInfo | null;
}

interface PromptData {
  text: string | null;
  loading: boolean;
  hasToken: boolean;
  provider: string | null;
  modelType: string | null;
  contextImages: ContextImage[] | null;
}

const EMPTY_PROMPT_DATA: PromptData = {
  text: null,
  loading: false,
  hasToken: false,
  provider: null,
  modelType: null,
  contextImages: null,
};

const createPromptData = (
  data: any,
  hasToken: boolean,
  loading: boolean = false,
): PromptData => ({
  text: data?.maybe_positive_prompt || null,
  loading,
  hasToken,
  provider: data?.maybe_generation_provider || null,
  modelType: data?.maybe_model_type || null,
  contextImages: data?.maybe_context_images || null,
});

const useCopyFeedback = () => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const triggerCopy = useCallback(() => {
    setCopied(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copied, triggerCopy };
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
    <span className="text-sm text-white/60 font-medium">{label}</span>
    <span className="text-sm text-white font-medium flex items-center gap-2">
      {value}
    </span>
  </div>
);

export default function MediaPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const mediaIdParam = routeId || searchParams.get("media") || undefined;

  const [media, setMedia] = useState<MediaData>({
    url: null,
    token: null,
    createdAt: null,
    isVideo: false,
    isLoaded: false,
    creator: null,
  });
  const [mediaRecordLoading, setMediaRecordLoading] = useState(true);

  const [promptData, setPromptData] = useState<PromptData>(EMPTY_PROMPT_DATA);

  const shareCopy = useCopyFeedback();
  const promptCopy = useCopyFeedback();

  const loadMedia = useCallback(async (id: string) => {
    setMediaRecordLoading(true);

    const mediaFilesApi = new MediaFilesApi();
    try {
      const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
        mediaFileToken: id,
      });

      if (mediaResponse.success && mediaResponse.data) {
        const file = mediaResponse.data;
        const url = file.media_links?.cdn_url || null;

        setMedia((prev) => {
          const isSameUrl = prev.url === url;
          return {
            url,
            token: file.token || id,
            createdAt: file.created_at || null,
            isVideo: url ? isVideoUrl(url) : false,
            isLoaded: isSameUrl ? prev.isLoaded : false,
            width: isSameUrl ? prev.width : undefined,
            height: isSameUrl ? prev.height : undefined,
            creator: file.maybe_creator_user || null,
          };
        });

        if (file.maybe_prompt_token) {
          setPromptData((prev) => ({ ...prev, hasToken: true, loading: true }));

          try {
            const promptsApi = new PromptsApi();
            const promptResponse = await promptsApi.GetPromptsByToken({
              token: file.maybe_prompt_token,
            });

            const data = promptResponse.success ? promptResponse.data : null;
            setPromptData(createPromptData(data, true, false));
          } catch {
            setPromptData((prev) => ({ ...prev, loading: false }));
          }
        } else {
          setPromptData(EMPTY_PROMPT_DATA);
        }
      } else {
        setMedia({
          url: null,
          token: null,
          createdAt: null,
          isVideo: false,
          isLoaded: false,
          creator: null,
        });
        toast.error("Media not found");
      }
    } catch {
      setMedia({
        url: null,
        token: null,
        createdAt: null,
        isVideo: false,
        isLoaded: false,
        creator: null,
      });
      toast.error("Failed to load media");
    } finally {
      setMediaRecordLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mediaIdParam) {
      loadMedia(mediaIdParam);
    }
  }, [mediaIdParam, loadMedia]);

  const handleCopyPrompt = useCallback(async () => {
    if (!promptData.text) return;
    try {
      await navigator.clipboard.writeText(promptData.text);
      promptCopy.triggerCopy();
    } catch {
      toast.error("Unable to copy prompt");
    }
  }, [promptData.text, promptCopy]);

  const handleCopyShareLink = useCallback(async () => {
    if (!media.token) return;
    const shareUrl = `${SHARE_URL_BASE}${media.token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      shareCopy.triggerCopy();
      toast.success("Share link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  }, [media.token, shareCopy]);

  const shareButtonIcon = shareCopy.copied ? faCheck : faLink;

  return (
    <div className="relative min-h-screen w-full p-4 pt-16 bg-dots flex items-start lg:items-center justify-center">
      <Seo
        title="Shared Media - ArtCraft"
        description="View shared media from ArtCraft."
      />
      <div className="mx-auto max-w-[1920px] w-full h-auto lg:h-[calc(100vh-100px)] min-h-[500px]">
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden rounded-xl border border-white/[2%]">
          {/* Media Preview Area */}
          <div className="relative flex-1 bg-black/20 backdrop-blur-lg flex items-center justify-center overflow-hidden min-h-[30vh] lg:min-h-0">
            {mediaRecordLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner className="h-12 w-12 text-white/60" />
              </div>
            ) : media.url ? (
              <div className="relative h-full w-full flex items-center justify-center">
                {media.isVideo ? (
                  <video
                    src={addCorsParam(media.url) || media.url}
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => console.error("Video failed to load")}
                    onLoadedData={(e) => {
                      const el = e.currentTarget;
                      setMedia((prev) => ({
                        ...prev,
                        isLoaded: true,
                        width: el.videoWidth,
                        height: el.videoHeight,
                      }));
                    }}
                  />
                ) : (
                  <>
                    <img
                      src={addCorsParam(media.url) || media.url}
                      alt="Generated image"
                      className="h-full w-full object-contain transition-opacity duration-300"
                      style={{ opacity: media.isLoaded ? 1 : 0 }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          PLACEHOLDER_IMAGES.DEFAULT;
                        (e.currentTarget as HTMLImageElement).style.opacity =
                          "0.3";
                        (
                          e.currentTarget as HTMLImageElement
                        ).dataset.brokenurl = media.url || "";
                        setMedia((prev) => ({ ...prev, isLoaded: true }));
                      }}
                      onLoad={(e) => {
                        const el = e.currentTarget;
                        setMedia((prev) => ({
                          ...prev,
                          isLoaded: true,
                          width: el.naturalWidth,
                          height: el.naturalHeight,
                        }));
                      }}
                    />
                    {!media.isLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner className="h-12 w-12 text-white/60" />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-white/60">Media not available</span>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="flex w-full lg:w-[360px] shrink-0 flex-col bg-ui-panel h-auto lg:h-full">
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
              {mediaRecordLoading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-white/10 rounded-xl" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 bg-white/10 rounded" />
                      <div className="h-3 w-12 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-40 bg-white/10 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-white/10 rounded" />
                    <div className="h-20 w-full bg-white/10 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square w-full bg-white/10 rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {media.creator && (
                    <div className="flex items-center gap-3 pb-2">
                      {media.creator.core_info ? (
                        <Gravatar
                          size={36}
                          username={media.creator.username}
                          email_hash={media.creator.email_gravatar_hash}
                          avatarIndex={
                            media.creator.core_info.default_avatar.image_index
                          }
                          backgroundIndex={
                            media.creator.core_info.default_avatar.color_index
                          }
                          className="rounded-xl border-white/10"
                        />
                      ) : (
                        <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-white/10 text-white/50 border border-white/5">
                          <FontAwesomeIcon icon={faUser} />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="text-white text-sm font-semibold leading-none">
                          {media.creator.display_name}
                        </span>
                        <span className="text-white/60 text-xs font-medium">
                          Author
                        </span>
                      </div>
                    </div>
                  )}

                  {media.createdAt && (
                    <div className="space-y-1.5 hidden">
                      <div className="text-sm font-medium text-white/90">
                        Created
                      </div>
                      <div className="text-sm text-white/60">
                        {dayjs(media.createdAt).format("MMM D, YYYY")} at{" "}
                        {dayjs(media.createdAt).format("hh:mm A")}
                      </div>
                    </div>
                  )}

                  {promptData.hasToken && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                            <FontAwesomeIcon icon={faPencil} />
                            <span>Prompt</span>
                          </div>
                          <button
                            onClick={handleCopyPrompt}
                            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={promptCopy.copied ? faCheck : faCopy}
                            />
                            <span>{promptCopy.copied ? "Copied" : "Copy"}</span>
                          </button>
                        </div>

                        <div className="relative text-sm text-white/90 break-words px-4 py-3 rounded-xl bg-black/20 leading-relaxed border border-white/5">
                          {promptData.loading ? (
                            <div className="flex items-center gap-2">
                              <LoadingSpinner className="h-4 w-4" />
                              <span className="text-sm text-white/60">
                                Loading prompt...
                              </span>
                            </div>
                          ) : (
                            promptData.text || (
                              <span className="text-sm text-white/60">
                                No prompt
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {promptData.contextImages &&
                        promptData.contextImages.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                              <FontAwesomeIcon icon={faImage} />
                              <span>Reference Images</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              {promptData.contextImages.map(
                                (contextImage, index) => {
                                  const { thumbnail } =
                                    getContextImageThumbnail(contextImage, {
                                      size: THUMBNAIL_SIZES.SMALL,
                                    });
                                  return (
                                    <div
                                      key={contextImage.media_token}
                                      className="glass relative aspect-square overflow-hidden rounded-lg border border-white/10 hover:border-white/40 transition-colors"
                                    >
                                      <img
                                        src={thumbnail}
                                        alt={`Reference image ${index + 1}`}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        )}

                      {(promptData.provider ||
                        promptData.modelType ||
                        media.createdAt) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                            <FontAwesomeIcon icon={faCircleInfo} />
                            <span>Information</span>
                          </div>

                          <div className="flex flex-col rounded-xl bg-black/20 border border-white/5 overflow-hidden">
                            {promptData.modelType && (
                              <InfoRow
                                label="Model"
                                value={
                                  <>
                                    {getModelCreatorIcon(promptData.modelType)}
                                    <span>
                                      {getModelDisplayName(
                                        promptData.modelType,
                                      )}
                                    </span>
                                  </>
                                }
                              />
                            )}

                            {promptData.provider && (
                              <InfoRow
                                label="Provider"
                                value={
                                  <>
                                    {getProviderIconByName(
                                      promptData.provider,
                                      "h-4 w-4 invert",
                                    )}
                                    <span>
                                      {getProviderDisplayName(
                                        promptData.provider,
                                      )}
                                    </span>
                                  </>
                                }
                              />
                            )}

                            {media.width && media.height && (
                              <InfoRow
                                label="Size"
                                value={`${media.width} × ${media.height}`}
                              />
                            )}

                            {media.createdAt && (
                              <InfoRow
                                label="Created"
                                value={dayjs(media.createdAt).format(
                                  "MMMM D, YYYY",
                                )}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <div className="p-5 pt-2 space-y-3 rounded-br-xl lg:rounded-bl-none rounded-bl-xl">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="w-full border border-ui-panel-border bg-ui-controls/40 hover:bg-ui-controls/60 text-white"
                  icon={shareButtonIcon}
                  variant="secondary"
                  onClick={handleCopyShareLink}
                >
                  {shareCopy.copied ? "Copied" : "Share"}
                </Button>
                <a
                  className={twMerge(
                    "w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors border border-ui-panel-border",
                    media.url
                      ? "bg-ui-controls/40 hover:bg-ui-controls/60 text-white"
                      : "bg-ui-controls/20 text-white/60 cursor-not-allowed pointer-events-none",
                  )}
                  href={
                    media.url ? addCorsParam(media.url) || media.url : undefined
                  }
                  download={
                    media.url
                      ? `artcraft-${media.token || (media.isVideo ? "video" : "image")}`
                      : undefined
                  }
                  aria-disabled={!media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FontAwesomeIcon icon={faArrowDownToLine} />
                  Download
                </a>
              </div>
              <Button
                icon={faArrowDownToLine}
                className="w-full shadow-lg shadow-brand-primary/20"
                variant="primary"
                onClick={() => {
                  window.location.href = "/download";
                }}
              >
                Download ArtCraft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
