import { signal } from "@preact/signals-core";
import { SceneGenereationMetaData } from "../models/sceneGenerationMetadata";
import { ArtStyle } from "~/enums";
import { styleList } from "../styleList";

export const promptsStore = {
  textBufferPositive: signal(""),
  textBufferNegative: signal(""),
  isUserInputPositive: signal(false),
  isUserInputNegative: signal(false),
  showNegativePrompt: signal(false),
};

export const globalIPAMediaToken = signal<string | null>(null);
export const adapterImage = signal<string | null>(null);
export const selectedArtStyle = signal<ArtStyle>(styleList[0].type);
export const upscale = signal(false);
export const faceDetail = signal(true);
export const styleStrength = signal(0.8);
export const lipSync = signal(false);
export const cinematic = signal(true);
export const enginePreProcessing = signal(false);

export const generateProgress = signal(-1);

export const setArtStyleSelection = (newStyle: ArtStyle) => {
  if (selectedArtStyle.value !== newStyle) {
    selectedArtStyle.value = newStyle;
  }
};
export const resetSceneGenerationMetadata = () => {
  promptsStore.textBufferPositive.value = "";
  promptsStore.textBufferNegative.value = "";
  promptsStore.isUserInputPositive.value = false;
  promptsStore.isUserInputNegative.value = false;
  promptsStore.showNegativePrompt.value = false;
  selectedArtStyle.value = styleList[0].type;
  upscale.value = false;
  faceDetail.value = false;
  styleStrength.value = 0.8;
  lipSync.value = false;
  cinematic.value = false;
  enginePreProcessing.value = false;
};

export const restoreSceneGenerationMetadata = (
  newData: SceneGenereationMetaData,
) => {
  if (newData.globalIPAMediaToken) {
    globalIPAMediaToken.value = newData.globalIPAMediaToken;
  }
  if (newData.positivePrompt && newData.positivePrompt !== "") {
    promptsStore.textBufferPositive.value = newData.positivePrompt;
    promptsStore.isUserInputPositive.value = true;
  }
  if (newData.negativePrompt && newData.negativePrompt !== "") {
    promptsStore.textBufferNegative.value = newData.negativePrompt;
    promptsStore.isUserInputNegative.value = true;
    promptsStore.showNegativePrompt.value = true;
  }
  if (newData.artisticStyle) {
    setArtStyleSelection(newData.artisticStyle);
  }
  if (newData.upscale) {
    upscale.value = newData.upscale;
  }
  if (newData.faceDetail) {
    faceDetail.value = newData.faceDetail;
  }
  if (newData.styleStrength) {
    styleStrength.value = newData.styleStrength;
  }
  if (newData.lipSync) {
    lipSync.value = newData.lipSync;
  }
  if (newData.cinematic) {
    cinematic.value = newData.cinematic;
  }
  if (newData.enginePreProcessing) {
    enginePreProcessing.value = newData.enginePreProcessing;
  }
};
