import { ArtStyleNames } from "./enums";
import {
  RandomTextsPositive,
  RandomTextsNegative,
} from "./data/randomTextList";

export type AIStylizeProps = {
  globalIpaMediaToken?: string;
  selectedArtStyle: ArtStyleNames;
  positivePrompt: string;
  negativePrompt: string;
  cinematic: boolean;
  enginePreProcessing: boolean;
  faceDetail: boolean;
  lipSync: boolean;
  upscale: boolean;
  styleStrength: number;
};
export const initialValues = {
  selectedArtStyle: ArtStyleNames.Anime2DFlat,
  positivePrompt: generateRandomTextPositive(ArtStyleNames.Anime2DFlat),
  negativePrompt: generateRandomTextNegative(ArtStyleNames.Anime2DFlat),
  cinematic: false,
  enginePreProcessing: false,
  faceDetail: false,
  lipSync: false,
  upscale: false,
  styleStrength: 0.8,
};
export function generateRandomTextPositive(artStyleName: ArtStyleNames) {
  const randomIndex = Math.floor(
    Math.random() * RandomTextsPositive[artStyleName].length,
  );
  const randomText = RandomTextsPositive[artStyleName][randomIndex];
  return randomText;
}

export function generateRandomTextNegative(artStyleName: ArtStyleNames) {
  const randomIndex = Math.floor(
    Math.random() * RandomTextsNegative[artStyleName].length,
  );
  const randomText = RandomTextsNegative[artStyleName][randomIndex];
  return randomText;
}
