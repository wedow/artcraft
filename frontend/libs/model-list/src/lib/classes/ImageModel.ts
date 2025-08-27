import { ModelCreator } from "src/index.js";
import { Model } from "./Model.js";
import { ModelCategory } from "../legacy/ModelConfig.js";
import { ModelTag } from "./metadata/ModelTag.js";

export class ImageModel extends Model {
  readonly maxGenerationCount: number;
  readonly defaultGenerationCount: number;

  // For inpainting models, does it require sending a mask?
  readonly usesInpaintingMask: boolean;

  constructor(args: {
    id: string;
    tauriId: string;
    fullName: string;
    category: ModelCategory;
    creator: ModelCreator;
    selectorName: string;
    selectorDescription: string;
    selectorBadges: string[];
    maxGenerationCount: number;
    defaultGenerationCount: number;
    usesInpaintingMask?: boolean;
    tags?: ModelTag[];
  }) {
    if (args.maxGenerationCount < 1) {
      throw new Error("maxGenerationCount must be at least 1");
    }
    if (args.defaultGenerationCount < 1) {
      throw new Error("defaultGenerationCount must be at least 1");
    }
    if (args.defaultGenerationCount > args.maxGenerationCount) {
      throw new Error("defaultGenerationCount must be less than or equal to maxGenerationCount");
    }
    super(args);
    this.maxGenerationCount = args.maxGenerationCount;
    this.defaultGenerationCount = args.defaultGenerationCount;
    this.usesInpaintingMask = args.usesInpaintingMask ?? false; 
  } 
}
