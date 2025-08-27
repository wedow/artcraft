import { useEffect, useMemo, useRef, useState } from "react";
import { JobContextType } from "@storyteller/common";
import { PromptBoxImage } from "@storyteller/ui-promptbox";
import BackgroundGallery from "./BackgroundGallery";
import {
  TEXT_TO_IMAGE_PAGE_MODEL_LIST,
  ModelPage,
  ClassyModelSelector,
  getSelectedImageModel,
} from "@storyteller/ui-model-selector";
import { ImageModel } from "@storyteller/model-list";
interface TextToImageProps {
  imageMediaId?: string;
  imageUrl?: string;
}
import { useTextToImageGenerationCompleteEvent } from "@storyteller/tauri-events";
import { useTextToImageStore } from "./TextToImageStore";
import { animated, useSpring } from "@react-spring/web";
import {
  galleryModalLightboxImage,
  galleryModalLightboxVisible,
} from "@storyteller/ui-gallery-modal";
import { Badge } from "@storyteller/ui-badge";

const PAGE_ID: ModelPage = ModelPage.TextToImage;

const TextToImage = ({ imageMediaId, imageUrl }: TextToImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const batches = useTextToImageStore((s) => s.batches);
  const startBatch = useTextToImageStore((s) => s.startBatch);
  const completeBatch = useTextToImageStore((s) => s.completeBatch);
  const resetBatches = useTextToImageStore((s) => s.reset);

  const selectedImageModel : ImageModel | undefined = getSelectedImageModel(PAGE_ID);

  const jobContext: JobContextType = {
    jobTokens: [],
    addJobToken: () => {},
    removeJobToken: () => {},
    clearJobTokens: () => {},
  };

  useTextToImageGenerationCompleteEvent(async (event) => {
    completeBatch(
      event.generated_images || [],
      event.maybe_frontend_subscriber_id,
    );
  });

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

  const bottomOffsetPx = 138;
  const targetTop = showPromptAtBottom
    ? Math.max(0, vh - bottomOffsetPx)
    : Math.floor(vh / 2);
  const promptAnim = useSpring({
    top: targetTop,
    config: { tension: 200, friction: 28, mass: 1.1 },
  });

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-56px)] w-full bg-[#121212]"
    >
      <div className="relative h-full w-full p-16">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md pb-12">
          {!showPromptAtBottom && (
            <div className="relative z-20 mb-52 flex flex-col items-center justify-center text-center drop-shadow-xl">
              <span className="text-7xl font-bold">Generate Image</span>
              <span className="pt-2 text-xl opacity-80">
                Add a prompt, then generate
              </span>
            </div>
          )}

          {hasAnyBatches && (
            <div className="h-full w-full overflow-y-auto pb-40">
              <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 pr-2">
                {batches.map((batch) => (
                  <div key={batch.id} className="flex items-start gap-4">
                    <div>
                      <div className="glass inline-block w-[320px] shrink-0 rounded-xl px-4 py-3 text-left text-sm text-white/90">
                        <div>{batch.prompt}</div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Badge
                          label={batch.modelLabel}
                          className="px-2 py-1 text-xs opacity-70"
                        />
                      </div>
                    </div>
                    <div className="grid flex-1 grid-cols-4 gap-4">
                      {batch.status === "pending" && batch.images.length === 0
                        ? Array.from({
                            length: Math.max(
                              1,
                              Math.min(4, batch.requestedCount ?? 4),
                            ),
                          }).map((_, i) => (
                            <div
                              key={`sk-${batch.id}-${i}`}
                              className="aspect-square w-full animate-pulse rounded-lg bg-white/5"
                            />
                          ))
                        : batch.images.slice(0, 4).map((img) => (
                            <button
                              key={img.media_token}
                              onClick={() => {
                                galleryModalLightboxImage.value = {
                                  id: img.media_token,
                                  label: batch.prompt || "Generated Image",
                                  thumbnail:
                                    img.maybe_thumbnail_template || img.cdn_url,
                                  fullImage: img.cdn_url,
                                  createdAt: new Date(
                                    batch.createdAt,
                                  ).toISOString(),
                                };
                                galleryModalLightboxVisible.value = true;
                              }}
                              className="aspect-square w-full overflow-hidden rounded-lg"
                            >
                              <img
                                src={img.cdn_url}
                                alt="Generated"
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <animated.div
            className="fixed left-1/2 z-20 w-[730px] -translate-x-1/2"
            style={promptAnim}
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
            <PromptBoxImage
              useJobContext={() => {
                return jobContext;
              }}
              selectedModel={selectedImageModel}
              imageMediaId={imageMediaId}
              url={imageUrl ?? undefined}
              onEnqueuePressed={async (prompt, count, subscriberId) => {
                const modelLabel = selectedImageModel?.fullName ?? "";
                startBatch(prompt, count, modelLabel, subscriberId);
              }}
            />
          </animated.div>

          {!showPromptAtBottom && <BackgroundGallery />}

          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            <ClassyModelSelector
              items={TEXT_TO_IMAGE_PAGE_MODEL_LIST}
              page={PAGE_ID}
              mode="hoverSelect"
              panelTitle="Select Model"
              panelClassName="min-w-[280px]"
              buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
              showIconsInList
              triggerLabel="Model"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToImage;
