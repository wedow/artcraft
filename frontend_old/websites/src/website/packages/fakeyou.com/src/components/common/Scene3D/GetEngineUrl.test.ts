import { MediaFileType } from "@storyteller/components/src/api/_common/enums/MediaFileType";
import { EngineMode } from "./EngineMode";
import { GetEngineUrl } from "./GetEngineUrl";
import { WeightCategory } from "@storyteller/components/src/api/_common/enums/WeightCategory";
import { WeightType } from "@storyteller/components/src/api/_common/enums/WeightType";
import { MediaFileSubtype } from "@storyteller/components/src/api/enums/MediaFileSubtype";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import { MediaFileClass } from "@storyteller/components/src/api/enums/MediaFileClass";

// These tests are important - constructing Storyteller Engine URLs is complicated,
// and we want to make sure we test the various cases that occur in production.

describe("mode", () => {
  test("studio", () => {
    const url = GetEngineUrl({
      mode: EngineMode.Studio,
      asset: { objectId: "foo" },
    });
    expect(url).toEqual("https://engine.fakeyou.com/?mode=studio&objectId=foo");
  });

  test("viewer", () => {
    const url = GetEngineUrl({
      mode: EngineMode.Viewer,
      asset: { objectId: "foo" },
    });
    expect(url).toEqual("https://engine.fakeyou.com/?mode=viewer&objectId=foo");
  });
});

describe("skybox", () => {
  test("from named skybox", () => {
    const url = GetEngineUrl({
      mode: EngineMode.Studio,
      asset: { objectId: "foo" },
      skybox: "gum_trees_4k",
    });
    expect(url).toEqual(
      "https://engine.fakeyou.com/?mode=studio&skybox=gum_trees_4k&objectId=foo"
    );
  });

  test("from hex color", () => {
    const url = GetEngineUrl({
      mode: EngineMode.Studio,
      asset: { objectId: "foo" },
      skybox: "ff0000",
    });
    expect(url).toEqual(
      "https://engine.fakeyou.com/?mode=studio&skybox=ff0000&objectId=foo"
    );
  });
});

describe("storyteller scene media file tokens", () => {
  test("scene token urls should work", () => {
    const url = GetEngineUrl({
      mode: EngineMode.Studio,
      asset: { storytellerSceneMediaFileToken: "TOKEN" },
    });
    expect(url).toEqual(
      "https://engine.fakeyou.com/?mode=studio&scene=remote://TOKEN.scn.ron"
    );
  });
});

describe("scene import token and extension", () => {
  test("scene token and extension", () => {
    const url = GetEngineUrl({
      mode: EngineMode.Studio,
      asset: { sceneImportToken: "FOO", extension: ".glb" },
    });
    expect(url).toEqual(
      "https://engine.fakeyou.com/?mode=studio&sceneImport=remote://FOO.glb"
    );
  });
});

describe("object ids", () => {
  test("object id urls should work", () => {
    const url = GetEngineUrl({
      mode: EngineMode.Studio,
      asset: { objectId: "foo" },
    });
    expect(url).toEqual("https://engine.fakeyou.com/?mode=studio&objectId=foo");
  });
});

// TODO(bt,2024-03-11): We're only testing one type of media file
describe("media files", () => {
  let mediaFile: MediaFile;

  beforeEach(() => {
    mediaFile = {
      token: "MEDIA_FILE_TOKEN",
      media_type: MediaFileType.GLB,
      media_class: MediaFileClass.Unknown,
      media_links: {
        cdn_url:
          "https://storage.googleapis.com/dev-vocodes-public/path/to/file",
        maybe_thumbnail_template: null,
        maybe_video_previews: null,
      },
      maybe_engine_category: null,
      maybe_animation_type: null,
      maybe_media_subtype: null,
      maybe_prompt_token: null,
      maybe_title: null,
      maybe_style_name: "style_name_here",
      maybe_original_filename: null,
      maybe_engine_extension: null,
      public_bucket_path: "path/to/file",
      maybe_batch_token: "BATCH_TOKEN",
      created_at: new Date(),
      updated_at: new Date(),
      maybe_creator_user: null,
      creator_set_visibility: "public",
      is_featured: false,
      // TODO(bt,2024-03-11): Make these fields optional
      maybe_model_weight_info: {
        title: "title",
        weight_token: "WEIGHT_TOKEN",
        weight_category: WeightCategory.SD,
        weight_type: WeightType.HIFIGAN_TT2,
        maybe_cover_image_public_bucket_path: "image",
        maybe_weight_creator: {
          user_token: "USER_TOKEN",
          username: "username",
          display_name: "display_name",
          gravatar_hash: "foo",
          default_avatar: {
            image_index: 1,
            color_index: 2,
          },
        },
      },
      maybe_scene_source_media_file_token: null,
      cover_image: {
        default_cover: {
          color_index: 1,
          image_index: 2,
        },
        maybe_cover_image_public_bucket_path: null,
      },
    };
  });

  // Production example:
  //   [from media type]  https://feature-mvp--fakeyou.netlify.app/studio-intro/m_ejhs95fc5aybp36h4a79k7523ds6an (scene file)
  describe("storyteller scene files", () => {
    test("from media type", () => {
      mediaFile.media_type = MediaFileType.SceneRon;
      mediaFile.maybe_media_subtype = null; // NB: Not the real subtype; forcing test to act on type.

      const url = GetEngineUrl({ mode: EngineMode.Studio, asset: mediaFile });
      expect(url).toEqual(
        "https://engine.fakeyou.com/?mode=studio&scene=remote://MEDIA_FILE_TOKEN.scn.ron"
      );
    });

    test("from media subtype and media type (.scn.ron)", () => {
      mediaFile.media_type = MediaFileType.SceneRon;
      mediaFile.maybe_media_subtype = MediaFileSubtype.StorytellerScene;

      const url = GetEngineUrl({ mode: EngineMode.Studio, asset: mediaFile });
      expect(url).toEqual(
        "https://engine.fakeyou.com/?mode=studio&scene=remote://MEDIA_FILE_TOKEN.scn.ron"
      );
    });
  });

  // Production examples:
  //   [without subtype]                  https://feature-mvp--fakeyou.netlify.app/media/m_tcj2zzncmvmn32f0yavmys5jdrc8cc (Majora's Mask GLB)
  //   [scene_import subtype]             https://feature-mvp--fakeyou.netlify.app/media/m_a504ma0n7vv3y80bw7bvgx7q2cecmb (Goron GLB)
  //   [scene media_class]                https://feature-mvp--fakeyou.netlify.app/media/m_2yw1ytwec9wj8y74k3kc26grn4q341 (Joel's island GLB)
  //   [scene media_class + scene_import] https://feature-mvp--fakeyou.netlify.app/studio-intro/m_zk0qkm1tgsdbh6e3c9kedy34vaympd (Scott's island)
  describe("generic scene file (not storyteller studio scene)", () => {
    // tests temporarily disabled -V

    // test("glb without subtype", () => {
    //   mediaFile.media_type = MediaFileType.GLB;
    //   mediaFile.maybe_media_subtype = null; // NB: Null in production (unless we backfill it)
    //   mediaFile.public_bucket_path = "path/to/file.gltf"; // NB: We still write extension ".gltf" for glb.

    //   const url = GetEngineUrl({ mode: EngineMode.Viewer, asset: mediaFile });
    //   expect(url).toEqual(
    //     "https://engine.fakeyou.com/?mode=viewer&sceneImport=https://storage.googleapis.com/dev-vocodes-public/path/to/file.gltf"
    //   );
    // });

    // test("glb with scene_import subtype", () => {
    //   mediaFile.media_type = MediaFileType.GLB;
    //   mediaFile.maybe_media_subtype = MediaFileSubtype.SceneImport;
    //   mediaFile.public_bucket_path = "path/to/file.gltf"; // NB: We still write extension ".gltf" for glb.

    //   const url = GetEngineUrl({ mode: EngineMode.Viewer, asset: mediaFile });
    //   expect(url).toEqual(
    //     "https://engine.fakeyou.com/?mode=viewer&sceneImport=https://storage.googleapis.com/dev-vocodes-public/path/to/file.gltf"
    //   );
    // });

    test("glb with scene media_class and storyteller_scene subtype", () => {
      mediaFile.media_type = MediaFileType.GLB;
      mediaFile.media_class = MediaFileClass.Scene;
      mediaFile.maybe_media_subtype = MediaFileSubtype.StorytellerScene;

      const url = GetEngineUrl({ mode: EngineMode.Studio, asset: mediaFile });
      expect(url).toEqual(
        "https://engine.fakeyou.com/?mode=studio&sceneImport=remote://MEDIA_FILE_TOKEN.glb"
      );
    });

    test("glb with scene media_class and scene_import subtype", () => {
      mediaFile.media_type = MediaFileType.GLB;
      mediaFile.media_class = MediaFileClass.Scene;
      mediaFile.maybe_media_subtype = MediaFileSubtype.SceneImport;

      const url = GetEngineUrl({ mode: EngineMode.Studio, asset: mediaFile });
      expect(url).toEqual(
        "https://engine.fakeyou.com/?mode=studio&sceneImport=remote://MEDIA_FILE_TOKEN.glb"
      );
    });
  });

  // Production examples:
  //   [mixamo glb]  https://feature-mvp--fakeyou.netlify.app/media/m_qgyq1n8mte3cdhsqrpxhca9xm3vpbj (waiting animation)
  //   [mixamo glb]  https://feature-mvp--fakeyou.netlify.app/media/m_fqvad63311epbts51kqdrc53rjzfe4 (swimming animation)
  //   [mixamo glb]  https://feature-mvp--fakeyou.netlify.app/media/m_ydwhanqm101tbm3zpt0ttrrvj1fh4j (YMCA dance animation)
  describe("mixamo animations", () => {
    test("from media subtype", () => {
      mediaFile.media_type = MediaFileType.Audio; // NB: Not the real time; forcing test to act on subtype.
      mediaFile.maybe_media_subtype = MediaFileSubtype.Mixamo;

      const url = GetEngineUrl({ mode: EngineMode.Studio, asset: mediaFile });
      expect(url).toEqual(
        "https://engine.fakeyou.com/?mode=studio&mixamo=https://storage.googleapis.com/dev-vocodes-public/path/to/file"
      );
    });
  });

  // Production examples:
  //   [without subtype]  https://feature-mvp--fakeyou.netlify.app/media/m_djbs4gjsjym41vn65py6ydzvy4ns3b (broken MocapNet animation)
  describe("bvh animations", () => {
    test("from media subtype", () => {
      mediaFile.media_type = MediaFileType.Audio; // NB: Not the real time; forcing test to act on subtype.
      mediaFile.maybe_media_subtype = MediaFileSubtype.MocapNet;

      const url = GetEngineUrl({ mode: EngineMode.Studio, asset: mediaFile });
      expect(url).toEqual(
        "https://engine.fakeyou.com/?mode=studio&bvh=https://storage.googleapis.com/dev-vocodes-public/path/to/file"
      );
    });

    test("bvh with empty subtype", () => {
      mediaFile.media_type = MediaFileType.BVH;
      mediaFile.maybe_media_subtype = null; // NB: Older BVH files do not specify the subtype

      const url = GetEngineUrl({ mode: EngineMode.Studio, asset: mediaFile });
      expect(url).toEqual(
        "https://engine.fakeyou.com/?mode=studio&bvh=https://storage.googleapis.com/dev-vocodes-public/path/to/file"
      );
    });
  });
});
