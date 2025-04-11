import { enumToKeyArr } from "resources";
import { UploadMediaResponse } from "@storyteller/components/src/api/media_files/UploadMedia";
import { UploadEngineAssetResponse } from "@storyteller/components/src/api/media_files/UploadEngineAsset";

// 1

// entity type is the broadest category of entities
// 1. Entity type > 2. Media/Weight category > 3. file extensions/weight names

export enum EntityType {
  unknown,
  media,
  weights,
}

// 2

// Media classes are broader categories of media, whereas MediaFilters below is mixed
export enum MediaClasses {
  unknown,
  audio,
  image,
  video,
  dimensional,
}

// MediaFilters is probably better titled MediaCategories
// I have to make that change in a couple places

export enum MediaFilters {
  all,
  audio,
  image,
  video,
  engine_asset,
}

export enum WeightsCategories {
  all,
  faceAnimation,
  tts,
  voiceConversion,
}

// 3

// WeightsFilters should be broken into enums described in WeightsCategories below
// as I have with the video/image/audio enums below
// the benefit of this is both granular and broad selection of types

export enum WeightsFilters {
  all,
  hifigan_tt2,
  rvc_v2,
  sd_1,
  "sd_1.5",
  sdxl,
  so_vits_svc,
  tt2,
  loRA,
  vall_e,
}

// media file types

export enum EngineTypes {
  bvh,
  fbx,
  glb,
  gltf,
  obj,
  ron,
  scene_ron,
  scene_json,
  pmd,
  vmd,
  pmx,
}

export enum AudioTypes {
  mp3,
  wav,
}

export enum ImageTypes {
  jpg,
  jpeg,
  png,
}

export enum VideoTypes {
  mp4,
}

// this enum refers to the endpoints for accessing entities

export enum EntityInputMode {
  bookmarks,
  media,
  weights,
  searchWeights,
}

// these prop types allow for strings to be matched against the enums above
// like when setting an allowed types on an input
// that is why they are in lowercase, so there is no complexity between the string values
// what you see is what you get

// Categories

export type MediaFilterProp = keyof typeof MediaFilters;
export type WeightCategoriesProp = keyof typeof WeightsCategories;

// Weight types (to be broken down by category)

export type WeightFilterProp = keyof typeof WeightsFilters;

// Media filter types

export type EngineFilterProp = keyof typeof EngineTypes;
export type AudioFilterProp = keyof typeof AudioTypes;
export type ImageFilterProp = keyof typeof ImageTypes;
export type VideoFilterProp = keyof typeof VideoTypes;

// Endpoint type

export type EntityModeProp = keyof typeof EntityInputMode;

// types specifically allowed for <input type="file" accept={accept:AcceptTypes} />

// export type AcceptTypes = EngineFilterProp | AudioFilterProp | ImageFilterProp | VideoFilterProp | WeightFilterProp;

export type AcceptTypes = MediaFilterProp | WeightCategoriesProp;

// used for filtering inference jobs by weight type

export type JobSelection = WeightCategoriesProp | WeightFilterProp;

// switch between upload reponse types
// this should propbably live elsewhere as it nothing is dependent on it
// and it is dependent on nothing here

export type UploaderResponse = UploadEngineAssetResponse | UploadMediaResponse;

export const ListEntityFilters = (mode?: EntityInputMode) => {
  // this an object of all types
  // in most cases it is better to have granular caterogization of types
  // but because any entity can/could(?) be bookmarked all types are agregated here
  // this is condensed because typescript didn't like when I broke it apart.
  // Will clean up soon, I promise
  const bookmarkFilters = Object.keys({ ...MediaFilters, ...WeightsFilters })
    .filter(val => isNaN(Number(val)))
    .reduce((obj, current) => ({ ...obj, [current]: current }), {});

  const selectedFilters =
    mode !== undefined
      ? [bookmarkFilters, MediaFilters, WeightsFilters, WeightsFilters][mode]
      : EntityInputMode;

  return Object.values(selectedFilters).filter(val => isNaN(Number(val)));
};

export const mediaClassOptions = (t = (v: string) => v) =>
  enumToKeyArr(MediaClasses).map((value, i) => ({
    value,
    label: t(`MediaClasses.${value}`),
  }));

// this creates a [{ label, value }] option array for select inputs based on desired endpoint mode
// note the use t() to translate labels
// this allows easily maintained translations for inputs

export const EntityFilterOptions = (
  mode?: EntityInputMode,
  t = (v: string) => v
) => {
  const translationNamespaces = [
    "BookmarksCategories",
    "MediaCategoriesPlural",
    "WeightsCategories",
    "WeightsCategories",
  ];
  const selectedNamespace = translationNamespaces[mode || -1];
  return ListEntityFilters(mode).map(value => {
    if (typeof value === "string")
      return {
        value,
        label:
          selectedNamespace !== undefined
            ? t(`${selectedNamespace}.${value}`)
            : value,
      };
    return { label: t(`${selectedNamespace}.all`), value: "all" };
  });
};

export const getMediaTypesByCategory = (mediaCategory: MediaFilters) =>
  enumToKeyArr(
    [
      { ...AudioTypes, ...ImageTypes, ...VideoTypes, ...EngineTypes },
      AudioTypes,
      ImageTypes,
      VideoTypes,
      EngineTypes,
    ][mediaCategory]
  );

export const isSelectedType = (
  mediaCategory: MediaFilters,
  fileExtension: string
) => getMediaTypesByCategory(mediaCategory).includes(fileExtension);

export const mediaCategoryfromString = (categoryStr: string) =>
  enumToKeyArr(MediaFilters).indexOf(categoryStr);

//renaming to getMediaCatgoryByType
export const getMediaCategory = (fileExtension: string) => {
  isSelectedType(MediaFilters.image, fileExtension);
  if (isSelectedType(MediaFilters.engine_asset, fileExtension))
    return MediaFilters.engine_asset;
  if (isSelectedType(MediaFilters.audio, fileExtension))
    return MediaFilters.audio;
  if (isSelectedType(MediaFilters.image, fileExtension))
    return MediaFilters.image;
  if (isSelectedType(MediaFilters.video, fileExtension))
    return MediaFilters.video;
  return MediaFilters.all; // will change to "unknown" eventually
};
