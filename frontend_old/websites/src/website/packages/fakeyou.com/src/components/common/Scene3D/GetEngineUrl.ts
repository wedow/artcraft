import {
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import { EngineMode } from "./EngineMode";
import { MediaFileSubtype } from "@storyteller/components/src/api/enums/MediaFileSubtype";
import { MediaFileType } from "@storyteller/components/src/api/_common/enums/MediaFileType";
import { MediaFileClass } from "@storyteller/components/src/api/enums/MediaFileClass";

// Storyteller Engine parameters
// These are documented here:
// https://www.notion.so/storytellerai/Studio-Iframe-Query-Params-a748a9929ec3404780c3884e7fb89bdb

interface GetEngineUrlArgs {
  mode: EngineMode;

  // override the URL for local development
  overrideURL?: string;

  // Polymorphic type of asset we're loading into the engine.
  asset: LoadableAsset;

  // Optional skybox color (hex) or name
  //  - Predefined skyboxes, eg. `gum_trees_4k`, `kloofendal_28d_misty_4k`, `meadow_4k`, `promenade_de_vidy_4k`, `scythian_tombs_4k`
  //  - Hex colors, eg. `ff0000` or `1a1a27`.
  skybox?: string;
}

// Support multiple "Media File" API response payloads.
// type MediaFile = MediaFileOne | MediaFileTwo ;

// Used to load raw built-in objects into the engine.
interface EngineObject {
  objectId: string;
}

// Used to load media files that are known a priori to be
// Storyteller Engine scenes (scene.ron files).
interface StorytellerSceneMediaFileToken {
  storytellerSceneMediaFileToken: string;
}

// Used for loading media tokens of non-".scn.ron" files.
// The extension must be provided to the engine, and the
// extension must include the leading period.
interface SceneImportTokenAndExtension {
  // Media file token for the asset
  sceneImportToken: string;

  // Extension, eg. ".glb", ".gltf", ".bvh".
  // The extension must have a leading period.
  extension: string;
}

export type LoadableAsset =
  | MediaFile
  | EngineObject
  | StorytellerSceneMediaFileToken
  | SceneImportTokenAndExtension;

const ENGINE_BASE_URL = "https://engine.fakeyou.com";

export function GetEngineUrl(args: GetEngineUrlArgs): string {
  let engineUrl = `${args.overrideURL || ENGINE_BASE_URL}/?mode=${args.mode}`;

  if (args.skybox) {
    engineUrl += `&skybox=${args.skybox}`;
  }

  if (isMediaFile(args.asset)) {
    const { mainURL } = MediaLinks(args.asset.media_links);

    if (
      args.asset.media_type === MediaFileType.GLB &&
      args.asset.media_class === MediaFileClass.Scene &&
      (args.asset.maybe_media_subtype === MediaFileSubtype.StorytellerScene ||
        args.asset.maybe_media_subtype === MediaFileSubtype.SceneImport)
    ) {
      // GLB Scenes
      // NB: Not sure if `maybe_media_subtype` is required to be "storyteller_scene".
      // We'll require it in the file for now, but may loosen this restriction.
      const sceneUrlRef = `remote://${args.asset.token}.glb`;
      engineUrl += `&sceneImport=${sceneUrlRef}`;
    } else if (
      args.asset.maybe_media_subtype === MediaFileSubtype.StorytellerScene ||
      args.asset.media_type === MediaFileType.SceneRon
    ) {
      // Storyteller Engine Scenes
      // NB: Storyteller Engine makes the API call to load the scene.
      // We don't need to pass the bucket path.
      // The engine, does, however, need a `.scn.ron` file extension.
      const sceneUrlRef = `remote://${args.asset.token}.scn.ron`;
      engineUrl += `&scene=${sceneUrlRef}`;
    } else if (args.asset.maybe_media_subtype === MediaFileSubtype.Mixamo) {
      engineUrl += `&mixamo=${mainURL}`;
    } else if (args.asset.maybe_media_subtype === MediaFileSubtype.MocapNet) {
      engineUrl += `&bvh=${mainURL}`;
    } else if (
      args.asset.media_type === MediaFileType.BVH &&
      (args.asset.maybe_media_subtype === null ||
        args.asset.maybe_media_subtype === undefined)
    ) {
      // NB: Older BVH files that do not specify a subtype are MocapNet,
      // which will take a bare "bvh" argument.
      engineUrl += `&bvh=${mainURL}`;
    } else {
      engineUrl += `&sceneImport=${mainURL}`;
    }
  } else if (isStorytellerSceneMediaFileToken(args.asset)) {
    // Storyteller Engine Scenes
    // NB: Storyteller Engine makes the API call to load the scene.
    // We don't need to pass the bucket path.
    // The engine, does, however, need a `.scn.ron` file extension.
    const sceneUrlRef = `remote://${args.asset.storytellerSceneMediaFileToken}.scn.ron`;
    engineUrl += `&scene=${sceneUrlRef}`;
  } else if (isSceneImportTokenAndExtension(args.asset)) {
    const sceneUrlRef = `remote://${args.asset.sceneImportToken}${args.asset.extension}`;
    engineUrl += `&sceneImport=${sceneUrlRef}`;
  } else if (isEngineObject(args.asset)) {
    // NB: This is an engine built-in, eg. `couch.gltf` or `sample-room.gltf`.
    engineUrl += `&objectId=${args.asset.objectId}`;
  }

  return engineUrl;
}

// Type guard for media files
const isMediaFile = (loadable: LoadableAsset): loadable is MediaFile => {
  return "token" in loadable;
};

// Type guard for engine objects
const isEngineObject = (loadable: LoadableAsset): loadable is EngineObject => {
  return "objectId" in loadable;
};

// Type guard for .scn.ron media tokens
const isStorytellerSceneMediaFileToken = (
  loadable: LoadableAsset
): loadable is StorytellerSceneMediaFileToken => {
  return "storytellerSceneMediaFileToken" in loadable;
};

// Type guard for loadable media tokens (not .scn.ron)
const isSceneImportTokenAndExtension = (
  loadable: LoadableAsset
): loadable is SceneImportTokenAndExtension => {
  return "sceneImportToken" in loadable;
};
