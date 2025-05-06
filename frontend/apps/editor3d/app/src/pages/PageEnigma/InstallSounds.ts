import { SoundRegistry, SoundEffect } from "@storyteller/soundboard";

// TODO: This is maintained in two places. Here and MiscSettingsPane.
export const InstallSounds = () => {
  const r = SoundRegistry.getInstance();
  if (r.hasSound("crumble")) {
    return;
  }
  r.setSoundOnce("flower", new SoundEffect("resources/sound/smrpg_flower.wav"));
  r.setSoundOnce("correct", new SoundEffect("resources/sound/smrpg_correct.wav"));
  r.setSoundOnce("next", new SoundEffect("resources/sound/oot_dialogue_next.wav", { defaultVolume: 1.0 }));
  r.setSoundOnce("done", new SoundEffect("resources/sound/oot_dialogue_done.wav", { defaultVolume: 1.0 }));
  r.setSoundOnce("crumble", new SoundEffect("resources/sound/smrpg_drybones_crumble.wav", { defaultVolume: 0.5 }));
  (window as any).sounds = r;
}
