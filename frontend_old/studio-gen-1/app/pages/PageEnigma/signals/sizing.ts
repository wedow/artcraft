import { signal, computed } from "@preact/signals-core";
import { characterGroup } from "~/pages/PageEnigma/signals/characterGroups";
import { objectGroup } from "~/pages/PageEnigma/signals/objectGroup";
import { pageWidth } from "~/signals";
import { timelineScrollX } from "~/pages/PageEnigma/signals/timing";

// timeline
export const scale = signal(1);
export const filmLength = signal(7);
export const timelineHeight = signal(0);

export const cameraMinimized = signal(false);
export const audioMinimized = signal(false);
export const objectsMinimized = signal(false);

export const characterHeight = computed(() => {
  if (!characterGroup.value.characters.length) {
    return 0;
  }
  return (
    characterGroup.value.characters.reduce((totalHeight, character) => {
      return totalHeight + (character.minimized ? 47 : 211);
    }, 0) + 8
  );
});

export const objectHeight = computed(() => {
  if (!objectGroup.value.objects.length) {
    return 0;
  }
  if (objectsMinimized.value) {
    return 55;
  }
  return 47 + objectGroup.value.objects.length * 47 + 8;
});

export const fullHeight = computed(() => {
  return (
    characterHeight.value +
    objectHeight.value +
    (cameraMinimized.value ? 47 : 103) +
    (audioMinimized.value ? 47 : 103) +
    24
  );
});

export const minimizeIconPosition = computed(() => {
  return Math.min(
    pageWidth.value - 270 + timelineScrollX.value,
    fullWidth.value - 24,
  );
});

export const timelinePremiumLockPosition = computed(() => {
  return Math.min(
    pageWidth.value - 2000 + timelineScrollX.value,
    fullWidth.value - 24,
  );
});

export const fullWidth = computed(() => {
  return filmLength.value * 60 * 4 * scale.value;
});

// side panel
export const sidePanelWidth = signal(0);
