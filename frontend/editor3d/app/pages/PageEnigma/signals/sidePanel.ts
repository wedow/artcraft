import { computed, signal } from "@preact/signals-core";
import { Tab } from "~/pages/PageEnigma/models";
import { pageHeight } from "~/signals";
import { AssetFilterOption } from "~/enums";

export const sidePanelVisible = signal(false);

export const dndSidePanelWidth = signal(-1);

export const cameraFilter = signal<AssetFilterOption>(AssetFilterOption.ALL);

export const sidePanelHeight = computed(() => {
  return pageHeight.value - 64; // header
});
