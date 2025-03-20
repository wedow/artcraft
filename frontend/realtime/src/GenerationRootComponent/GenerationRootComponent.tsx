import { faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { useSignals } from "@preact/signals-react/runtime";
import { Button, LoadingSpinner } from "~/components/ui";
import { useRenderCounter } from "~/hooks/useRenderCounter";
import { GenerationLoadingState, generationSignal } from "~/signals";
import { useRef } from "react";

export const GenerationRootComponent = () => {
  // This is a hook that will log the number of times the component has rerendered
  // Let's make sure we only log once
  useRenderCounter("GenerationRootComponent");
  useSignals();

  const generationState = generationSignal.value;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    if (!inputRef.current) {
      return
    };

    // TODO: For testing only!!! Remove when finished
    if (generationState.loadingState === GenerationLoadingState.GENERATING) {
      generationSignal.value = { loadingState: GenerationLoadingState.INIT, prompt: "" };
      return;
    }

    const prompt = inputRef.current.value;
    generationSignal.value = { loadingState: GenerationLoadingState.GENERATING, prompt };
    
    // TODO: Write the signal change effect in generationSignals.ts
    // TODO: Call the server to generate the image
  };

  let contentElement;
  switch (generationState.loadingState) {
    case GenerationLoadingState.INIT:
      contentElement = 
            <div className="flex flex-col items-center justify-center mb-32">
            <span className="text-9xl font-bold">Generate Image</span>
            <span className="text-3xl pt-2">Imagine, Describe, Generate.</span>
            </div>
            break;
    case GenerationLoadingState.GENERATING:
    case GenerationLoadingState.GENERATED:
      contentElement = <GenerationContent loadingState={generationState.loadingState} imageB64={generationState.imageB64} prompt={generationState.prompt} />
      break;
  }

  // const isButtonDisabled = generationState.loadingState === GenerationLoadingState.GENERATING;
  const isButtonDisabled = false;

  return (
    <>
        <div className="fixed flex flex-col items-center justify-center w-full h-full gap-y-12 transition-all duration-1000">
          {contentElement}
            <div className="glass p-3 rounded-xl flex w-1/2 border-ui-panel border-2">
                <input ref={inputRef} type="text" placeholder="Describe what you want to see..." className="flex-1 text-lg rounded-md bg-transparent focus:outline-none" />
                <Button icon={faSparkles} variant="primary" className="text-lg" onClick={handleGenerate} disabled={isButtonDisabled}>Generate</Button>
            </div>
        </div>
    </>
  );
};

const GenerationContent = (generationState : {
  loadingState: GenerationLoadingState;
  imageB64?: string;
  prompt: string;
}) => {

  const imgBoxStyle = {
    width: "1024px",
    height: "1024px",
  }

  let imgBoxContent;
  if (generationState.loadingState === GenerationLoadingState.GENERATING) {
    imgBoxContent = (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner isShowing={true} message="Generating image..." />
      </div>
    )
  } else if (generationState.loadingState === GenerationLoadingState.GENERATED) {
    imgBoxContent = (
        <img src={generationState.imageB64} alt="Generated Image" />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center" >
      <div style={imgBoxStyle} className="bg-ui-border rounded-lg">
        {imgBoxContent}
      </div>
      <div className="bg-ui-panel w-full min-h-12 flex items-center justify-center">
        <span className="text-lg p-4">{generationState.prompt}</span>
      </div>

    </div>
  )
}
