import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundRegistry } from "@storyteller/soundboard";
import { GetAppPreferences } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";

type SoraImageGenerationFailed = {
  prompt: string,
};

export const useImageGenerationFailureEvent = () => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<SoraImageGenerationFailed>('sora-image-generation-failed', async (event) => {
        console.log("Image generation failure event received:", event);
        const prefs = await GetAppPreferences();
        const soundName = prefs.preferences?.generation_failure_sound;
        if (soundName !== undefined) {
          const registry = SoundRegistry.getInstance();
          registry.playSound(soundName);
        }
        toast.error("Image generation failed!");
      });

      if (isUnmounted) {
        unlisten.then(f => f()); // Unsubscribe if unmounted early.
      }
    };

    setup();
    
    return () => {
      isUnmounted = true;
      unlisten.then(f => f());
    };

  }, []);
}
