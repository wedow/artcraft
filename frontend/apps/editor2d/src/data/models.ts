// Model and LoRA type definitions
export interface ModelData {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  description?: string;
  isDownloaded: boolean;
  compatibleLoraIds?: string[]; // LoRAs that work with this model
}

export interface LoraData {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  isDownloaded: boolean;
  compatibleModelIds: string[]; // Models this LoRA works with
}

// Available models dummy data
export const models: ModelData[] = [
  {
    id: "1",
    name: "Base",
    type: "Concept",
    imageUrl: "/images/models/scenery.png",
    description: "Base Model",
    isDownloaded: false,
    compatibleLoraIds: ["detailed_tweaker", "scenery_enhancer"],
  },
  // {
  //   id: "realistic",
  //   name: "Realistic",
  //   type: "Realistic",
  //   imageUrl: "/images/models/realistic.png",
  //   description: "Photorealistic image generation",
  //   isDownloaded: true,
  //   compatibleLoraIds: [
  //     "detailed_tweaker",
  //     "scenery_enhancer",
  //     "portrait_plus",
  //   ],
  // },
  // {
  //   id: "flat_2d",
  //   name: "Flat 2D",
  //   type: "Flat 2D",
  //   imageUrl: "/images/models/flat_2d.png",
  //   description: "Flat 2D illustration style",
  //   isDownloaded: true,
  //   compatibleLoraIds: ["toon_enhancer", "detailed_tweaker"],
  // },
  // {
  //   id: "ghibli",
  //   name: "Ghibli",
  //   type: "Ghibli",
  //   imageUrl: "/images/models/ghibli.png",
  //   description: "Studio Ghibli inspired style",
  //   isDownloaded: false,
  //   compatibleLoraIds: ["anime_style"],
  // },
  // {
  //   id: "scenery",
  //   name: "Scenery",
  //   type: "Scenery",
  //   imageUrl: "/images/models/scenery.png",
  //   description: "Beautiful landscape generation",
  //   isDownloaded: true,
  //   compatibleLoraIds: ["scenery_enhancer"],
  // },
  // {
  //   id: "concept",
  //   name: "Concept",
  //   type: "Concept",
  //   imageUrl: "/images/models/concept.png",
  //   description: "Abstract concept art generation",
  //   isDownloaded: false,
  //   compatibleLoraIds: ["detailed_tweaker", "scenery_enhancer"],
  // },
];

// Available LoRAs
export const loras: LoraData[] = [
  {
    id: "detailed_tweaker",
    name: "Detailed Tweaker",
    imageUrl: "/resources/loras/detailedtweaker.jpg",
    description: "Enhances fine details in generated images",
    isDownloaded: true,
    compatibleModelIds: [
      "realistic",
      "concept",
      "anime",
      "flat_2d",
      "flux_realtime",
    ],
  },
  {
    id: "portrait_plus",
    name: "Portrait+",
    imageUrl: "/resources/loras/portraitplus.jpg",
    description: "Improves portrait generation",
    isDownloaded: false,
    compatibleModelIds: ["realistic", "flux_realtime"],
  },
  {
    id: "scenery_enhancer",
    name: "Scenery Enhancer",
    imageUrl: "/resources/loras/sceneryenhancer.jpg",
    description: "Enhances landscape generation",
    isDownloaded: true,
    compatibleModelIds: ["realistic", "concept", "scenery"],
  },
  {
    id: "anime_style",
    name: "Anime Style+",
    imageUrl: "/resources/loras/animestyle.jpg",
    description: "Enhances anime art style",
    isDownloaded: false,
    compatibleModelIds: ["anime", "ghibli"],
  },
  {
    id: "toon_enhancer",
    name: "Toon Enhancer",
    imageUrl: "/resources/loras/toonenhancer.jpg",
    description: "Enhances cartoon styles",
    isDownloaded: true,
    compatibleModelIds: ["cartoon", "flat_2d"],
  },
];

// Helper functions
export const getModelById = (id: string): ModelData | undefined => {
  return models.find((model) => model.id === id);
};

export const getLoraById = (id: string): LoraData | undefined => {
  return loras.find((lora) => lora.id === id);
};

export const isLoraCompatibleWithModel = (
  loraId: string,
  modelId: string,
): boolean => {
  const lora = getLoraById(loraId);
  return lora ? lora.compatibleModelIds.includes(modelId) : false;
};

export const getCompatibleLorasForModel = (modelId: string): LoraData[] => {
  return loras.filter((lora) => lora.compatibleModelIds.includes(modelId));
};
