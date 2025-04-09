import { signal } from "@preact/signals-core";

export const currentTime = signal(0);
// TODO: scrubber time exists to sync the time the scrubber points
// to with the time display on video controls, we could eliminate this
// and calculate everything properly with currentTime, but that would
// be a developer brain struggle for another day.
export const pointerScrubber = signal(0);
export const secondaryScrubber = signal(0);
export const timelineScrollX = signal(0);
export const timelineScrollY = signal(0);
export const stylizeScrollX = signal(0);
