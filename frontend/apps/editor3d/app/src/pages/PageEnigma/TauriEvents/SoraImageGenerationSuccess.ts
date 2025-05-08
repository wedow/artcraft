import { SoundRegistry, SoundEffect } from "@storyteller/soundboard";
import { listen } from '@tauri-apps/api/event';
import { AppPreferencesPayload, CustomDirectory, GetAppPreferences, SystemDirectory } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";

type ImageGenerationSuccess = {
  media_file_token: string,
};

export const InstallImageGenerationSuccess = () => {
  listen<ImageGenerationSuccess>('sora-image-generation-complete', async (event) => {
    const prefs = await GetAppPreferences();
    const soundName = prefs.preferences?.generation_success_sound;
    if (soundName !== undefined) {
      const registry = SoundRegistry.getInstance();
      registry.playSound(soundName);
    }
    toast.success("Image generated!");
  });
}

export const ImageGenerationSuccess = () => {
}
