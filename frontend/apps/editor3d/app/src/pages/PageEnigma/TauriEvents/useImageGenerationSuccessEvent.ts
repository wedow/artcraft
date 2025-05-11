import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundRegistry } from "@storyteller/soundboard";
import { GetAppPreferences } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";

type ImageGenerationSuccess = {
  media_file_token: string,
};

export const useImageGenerationSuccessEvent = () => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<ImageGenerationSuccess>('sora-image-generation-complete', async (event) => {
        console.log("Image generation success event received:", event);
        const prefs = await GetAppPreferences();
        const soundName = prefs.preferences?.generation_success_sound;
        if (soundName !== undefined) {
          const registry = SoundRegistry.getInstance();
          registry.playSound(soundName);
        }
        toast.success("Image generated!");
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
