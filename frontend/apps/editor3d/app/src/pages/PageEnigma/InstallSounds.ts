import { SoundRegistry, SoundEffect } from "@storyteller/soundboard";

// TODO: This is maintained in two places. Here and MiscSettingsPane.
export const InstallSounds = () => {
  const r = SoundRegistry.getInstance();
  if (r.hasSound("decline_normal")) {
    return;
  }

  // Good for simple immediate enqueue
  r.setSoundOnce("done", new SoundEffect("resources/sound/oot_dialogue_done.wav", { defaultVolume: 0.2 })); // DEFAULT

  // Good for simple immediate failure
  r.setSoundOnce("error_chirp", new SoundEffect("resources/sound/goldensun_135.wav", { defaultVolume: 0.2 }));
  r.setSoundOnce("spike_throw", new SoundEffect("resources/sound/smrpg_enemy_spikethrow.wav", { defaultVolume: 0.1 })); // DEFAULT

  // Good for simple async success
  r.setSoundOnce("special_flower", new SoundEffect("resources/sound/smrpg_specialflower.wav", { defaultVolume: 0.2 })); // DEFAULT

  // Good for async errors
  r.setSoundOnce("crumble", new SoundEffect("resources/sound/smrpg_drybones_crumble.wav", { defaultVolume: 0.1 })); // DEFAULT
  r.setSoundOnce("special_alert", new SoundEffect("resources/sound/goldensun_214.wav", { defaultVolume: 0.2 }));

  // Good for menus
  r.setSoundOnce("next", new SoundEffect("resources/sound/oot_dialogue_next.wav", { defaultVolume: 0.2 }));
  r.setSoundOnce("select", new SoundEffect("resources/sound/goldensun_111.wav", { defaultVolume: 0.4 }));

  // Good for special reward / celebration
  r.setSoundOnce("correct", new SoundEffect("resources/sound/smrpg_correct.wav", { defaultVolume: 0.1 }));
  r.setSoundOnce("flower", new SoundEffect("resources/sound/smrpg_flower.wav", { defaultVolume: 0.1 }));

  // Misc / ungrouped
  r.setSoundOnce("accept_chirp", new SoundEffect("resources/sound/goldensun_101.wav", { defaultVolume: 0.2 }));
  r.setSoundOnce("accept_normal_level_1", new SoundEffect("resources/sound/goldensun_173.wav", { defaultVolume: 0.2 }));
  r.setSoundOnce("accept_normal_level_2", new SoundEffect("resources/sound/goldensun_174.wav", { defaultVolume: 0.2 }));
  r.setSoundOnce("accept_normal_level_3", new SoundEffect("resources/sound/goldensun_175.wav", { defaultVolume: 0.2 }));
  r.setSoundOnce("decline_chirp", new SoundEffect("resources/sound/goldensun_102.wav", { defaultVolume: 0.2 }));
  r.setSoundOnce("decline_normal", new SoundEffect("resources/sound/goldensun_113.wav", { defaultVolume: 0.2 }));

  (window as any).sounds = r;
}
