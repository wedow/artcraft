import { GaussianModel } from "../classes/GaussianModel.js";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";

// TODO: Some of the model configs, such as generation counts, are authoritatively controlled in `legacy/Models.ts`

export const GAUSSIAN_MODELS : GaussianModel [] = [
  new GaussianModel({
    id: "world_labs_marble",
    tauriId: "world_labs_marble",
    fullName: "WorldLabs Marble",
    category: "gaussian",
    creator: ModelCreator.WorldLabs,
    selectorName: "WorldLabs Marble",
    selectorDescription: "Amazing",
    selectorBadges: ["10 sec."],
    progressBarTime: 10000,
  }),
];

export const GAUSSIAN_MODELS_BY_ID: Map<string, GaussianModel> = new Map(
  GAUSSIAN_MODELS.map((model) => [model.id, model]),
);

if (GAUSSIAN_MODELS_BY_ID.size !== GAUSSIAN_MODELS.length) {
  throw new Error("All gaussian models must have unique IDs");
}
