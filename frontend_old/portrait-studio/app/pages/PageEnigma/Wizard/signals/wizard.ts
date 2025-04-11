import { signal } from "@preact/signals-core";
import { MediaItem } from "~/pages/PageEnigma/models";
import { WizardItem } from "~/pages/PageEnigma/Wizard/Wizard";

export const showWizard = signal("");
export const currentStep = signal<WizardItem | null>(null);
export const textInput = signal("");

export const selectedAudios = signal<MediaItem[]>([]);
export const selectedBackground = signal<MediaItem | null>(null);
export const selectedCharacters = signal<MediaItem[]>([]);
export const selectedObjects = signal<MediaItem[]>([]);

export const audioWizardItems = signal<MediaItem[] | null>(null);
export const backgroundWizardItems = signal<MediaItem[] | null>(null);
export const characterWizardItems = signal<MediaItem[] | null>(null);
export const objectWizardItems = signal<MediaItem[] | null>(null);

export const selectedRemixCard = signal<{
  text: string;
  defaultVideo: string;
  hoverVideo: string;
  token: string;
} | null>(null);
