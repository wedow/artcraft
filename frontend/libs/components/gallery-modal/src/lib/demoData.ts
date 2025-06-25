import { FilterEngineCategories } from "@storyteller/api";
import { GalleryItem } from "./types";

const now = new Date().toISOString();

export const demoCharacters: GalleryItem[] = [
  {
    id: "m_gff67btr810vg3ng9szj85zskztcgy",
    label: "Story Girl",
    thumbnail: "/resources/characters/img13.png",
    fullImage: "/resources/characters/img13.png",
    name: "Story Girl",
    mediaClass: "dimensional",
    engineCategory: FilterEngineCategories.CHARACTER,
    createdAt: now,
  },
  {
    id: "m_ja13tz27cqqvy366tsed4z4kh4gg0m",
    label: "Roko",
    thumbnail: "/resources/characters/roko.png",
    fullImage: "/resources/characters/roko.png",
    name: "Roko",
    mediaClass: "dimensional",
    engineCategory: FilterEngineCategories.CHARACTER,
    createdAt: now,
  },
];

export const demoShapes: GalleryItem[] = [
  {
    id: "Box",
    label: "Cube",
    thumbnail: "/resources/shapes/cube.png",
    fullImage: "/resources/shapes/cube.png",
    name: "Cube",
    mediaClass: "dimensional",
    engineCategory: FilterEngineCategories.OBJECT,
    createdAt: now,
    assetType: "shape",
  },
  {
    id: "Cylinder",
    label: "Cylinder",
    thumbnail: "/resources/shapes/cylinder.png",
    fullImage: "/resources/shapes/cylinder.png",
    name: "Cylinder",
    mediaClass: "dimensional",
    engineCategory: FilterEngineCategories.OBJECT,
    createdAt: now,
    assetType: "shape",
  },
  {
    id: "Donut",
    label: "Donut",
    thumbnail: "/resources/shapes/donut.png",
    fullImage: "/resources/shapes/donut.png",
    name: "Donut",
    mediaClass: "dimensional",
    engineCategory: FilterEngineCategories.OBJECT,
    createdAt: now,
    assetType: "shape",
  },
  {
    id: "Sphere",
    label: "Sphere",
    thumbnail: "/resources/shapes/sphere.png",
    fullImage: "/resources/shapes/sphere.png",
    name: "Sphere",
    mediaClass: "dimensional",
    engineCategory: FilterEngineCategories.OBJECT,
    createdAt: now,
    assetType: "shape",
  },
];
