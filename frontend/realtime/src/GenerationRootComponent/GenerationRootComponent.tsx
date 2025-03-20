import { faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "~/components/ui";
import { useRenderCounter } from "~/hooks/useRenderCounter";

export const GenerationRootComponent = () => {
  // This is a hook that will log the number of times the component has rerendered
  // Let's make sure we only log once
  useRenderCounter("GenerationRootComponent");

  return (
    <>
        <div className="fixed flex flex-col items-center justify-center w-full h-full gap-y-32">
            <div className="flex flex-col items-center justify-center">
            <span className="text-9xl font-bold">Generate Image</span>
            <span className="text-3xl pt-2">Imagine, Describe, Generate.</span>
            </div>
            <div className="glass p-3 rounded-xl flex w-1/2 border-ui-panel border-2">
                <input type="text" placeholder="Describe what you want to see..." className="flex-1 text-lg rounded-md bg-transparent focus:outline-none" />
                <Button icon={faSparkles} variant="primary" className="text-lg">Generate</Button>
            </div>
        </div>
    </>
  );
};
