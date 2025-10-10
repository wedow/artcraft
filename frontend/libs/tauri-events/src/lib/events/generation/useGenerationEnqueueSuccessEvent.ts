import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundRegistry } from "@storyteller/soundboard";
import { GetAppPreferences } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";
import { GenerationAction, GenerationModel, GenerationServiceProvider } from "./common";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";

type GenerationEnqueueSuccessEvent = {
  action: GenerationAction,
  service: GenerationServiceProvider,
  model?: GenerationModel,
}; 

console.log(">>> test - useGenerationEnqueueSuccessEvent defined")

export const useGenerationEnqueueSuccessEvent = () => {
  console.log(">>> test - useGenerationEnqueueSuccessEvent called")

  useEffect(() => {
    console.log(">>> test - useGenerationEnqueueSuccessEvent useEffect")

    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      console.log(">>> test - useGenerationEnqueueSuccessEvent setup")
      unlisten = listen<BasicEventWrapper<GenerationEnqueueSuccessEvent>>('generation-enqueue-success-event', async (event) => {
        console.log("Generation enqueue success event received (1):", event);
        const prefs = await GetAppPreferences();
        console.log("Generation enqueue success event received (2) ... prefs", prefs);
        const soundName = prefs.preferences?.enqueue_success_sound;
        console.log("Generation enqueue success event received (3) ... soundName", soundName);
        if (soundName !== undefined) {
          const registry = SoundRegistry.getInstance();
          console.log("Generation enqueue success event received (4) ... play sound", soundName);
          registry.playSound(soundName);
        }
        console.log("Generation enqueue success event received (5) ... message before");
        const message = makeMessage(event.payload.data);
        console.log("Generation enqueue success event received (6) ... message", message);
        toast.success(message);
        (window as any).toast = toast
      });

      if (isUnmounted) {
        unlisten.then(f => f()); // Unsubscribe if unmounted early.
      }
    };

    setup();
    
    return () => {
      console.log(">>> test - useGenerationEnqueueSuccessEvent unmount")
      isUnmounted = true;
      unlisten.then(f => f());
    };

  }, []);
}

const makeMessage = (event: GenerationEnqueueSuccessEvent) => {
  switch (event.action) {
    case GenerationAction.GenerateImage:
      return "Image generation enqueued!";
    case GenerationAction.GenerateVideo:
      return "Video generation enqueued!";
    case GenerationAction.RemoveBackground:
      return "Background removal enqueued!";
    case GenerationAction.ImageTo3d:
      return "Image to 3D enqueued!";
    default:
      return "Generation enqueued!";
  }
}
