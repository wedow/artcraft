import { FilterEngineCategories } from "@storyteller/api";

export interface GalleryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage?: string | null;
  createdAt: string;
  mediaClass?: string;
  name?: string;
  description?: string;
  engineCategory?: FilterEngineCategories;
  assetType?: "shape" | "object";
  isFeatured?: boolean;
}
