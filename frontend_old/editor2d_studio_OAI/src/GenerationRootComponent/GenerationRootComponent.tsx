import { faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { useSignals } from "@preact/signals-react/runtime";
import { Button, LoadingSpinner } from "~/components/ui";
import { useRenderCounter } from "~/hooks/useRenderCounter";
import { GenerationLoadingState, generationSignal } from "~/signals";
import { useRef, useState } from "react";
// import BackgroundGallery from "./BackgroundGallery";
import { twMerge } from "tailwind-merge";
import { Transition } from "@headlessui/react";
import { GenerationEngine } from "~/KonvaApp/GenerationEngine";
import { ensureBase64Prefix } from "~/KonvaApp/EngineUtitlities/Base64Helpers";

export const GenerationRootComponent = ({
  generationEngineRef,
}: {
  generationEngineRef: React.MutableRefObject<GenerationEngine | null>;
}) => {
  // This is a hook that will log the number of times the component has rerendered
  // Let's make sure we only log once
  useRenderCounter("GenerationRootComponent");
  useSignals();

  const generationState = generationSignal.value;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  if (generationEngineRef.current === null) {
    generationEngineRef.current = new GenerationEngine();
  }

  const handleGenerate = () => {
    if (!inputRef.current) {
      return;
    }

    const prompt = inputRef.current.value;
    generationSignal.value = {
      loadingState: GenerationLoadingState.GENERATING,
      prompt,
    };
  };

  let contentElement;
  switch (generationState.loadingState) {
    case GenerationLoadingState.INIT:
      contentElement = null;
      break;
    case GenerationLoadingState.GENERATING:
    case GenerationLoadingState.GENERATED:
      contentElement = (
        <GenerationContent
          loadingState={generationState.loadingState}
          imageB64={generationState.imageB64}
          prompt={generationState.prompt}
        />
      );
      break;
  }

  // const isButtonDisabled = generationState.loadingState === GenerationLoadingState.GENERATING;
  const isButtonDisabled = false;

  return (
    <>
      <div className="fixed z-10 flex h-full w-full flex-col items-center justify-center transition-all duration-500">
        <Transition
          show={generationState.loadingState !== GenerationLoadingState.INIT}
          enter="transition-opacity duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          as="div"
        >
          {contentElement}
        </Transition>
        <div
          className={twMerge(
            "absolute flex w-full flex-col items-center justify-center gap-16 transition-all duration-500",
            generationState.loadingState === GenerationLoadingState.INIT
              ? "bottom-1/2 translate-y-1/2 transform"
              : "bottom-8",
          )}
        >
          <Transition
            show={generationState.loadingState === GenerationLoadingState.INIT}
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            as="div"
          >
            <div className="flex flex-col items-center justify-center text-center drop-shadow-xl">
              <span className="text-8xl font-bold">Generate Image</span>
              <span className="pt-2 text-2xl opacity-80">
                Imagine, Describe, Generate.
              </span>
            </div>
          </Transition>
          <div
            className={twMerge(
              "glass flex min-h-[56px] w-full max-w-[900px] items-end rounded-xl border-2 p-3 shadow-xl transition-all duration-[400ms] ease-in-out",
              isInputFocused ? "border-primary-400/60" : "border-ui-panel",
            )}
          >
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Describe what you want to see..."
              className="max-h-[120px] min-h-[40px] flex-1 resize-none overflow-y-auto rounded-md bg-transparent px-3 py-2 text-lg leading-normal focus:outline-none"
              style={{ lineHeight: "24px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
              autoFocus={true}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            <Button
              icon={faSparkles}
              variant="primary"
              className="text-md ml-2 self-end"
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              loading={
                generationState.loadingState ===
                GenerationLoadingState.GENERATING
              }
            >
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* <Transition
        show={generationState.loadingState === GenerationLoadingState.INIT}
        enter="transition-opacity duration-700"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-700"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        as="div"
      >
        <BackgroundGallery />
      </Transition> */}
    </>
  );
};

const GenerationContent = (generationState: {
  loadingState: GenerationLoadingState;
  imageB64?: string;
  prompt: string;
}) => {
  let imgBoxContent;
  if (generationState.loadingState === GenerationLoadingState.GENERATING) {
    imgBoxContent = (
      <div className="flex h-full w-full flex-col items-center justify-center gap-7">
        <LoadingSpinner isShowing={true} message="Generating image..." />
      </div>
    );
  } else if (
    generationState.loadingState === GenerationLoadingState.GENERATED &&
    generationState.imageB64
  ) {
    imgBoxContent = (
      <img
        src={ensureBase64Prefix(generationState.imageB64)}
        alt="Generated Image"
        className="h-full w-full object-contain"
      />
    );
  }

  return (
    <>
      <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center">
        <div className="aspect-[1/1] w-[min(80vw,68vh)] overflow-clip rounded-t-lg bg-[#29292D]/60">
          {imgBoxContent}
        </div>
        <div className="mb-16 flex w-[min(80vw,68vh)] rounded-b-lg bg-[#29292D]">
          <span className="p-3.5 text-sm opacity-50">
            {generationState.prompt || "No prompt provided"}
          </span>
        </div>
      </div>
    </>
  );
};
