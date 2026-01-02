import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import {
  ScopedEntityTypes,
  ScopedMediaFileType,
  ScopedWeightTypes,
  UserBookmarksApi,
} from "~/Classes/ApiManager/UserBookmarksApi";

const mockBookmark = {
  created_at: "2024-06-15T11:15:26.997Z",
  details: {
    entity_token: "string",
    entity_type: "user",
    maybe_media_file_data: {
      maybe_creator: {
        default_avatar: {
          color_index: 0,
          image_index: 0,
        },
        display_name: "string",
        gravatar_hash: "string",
        user_token: "string",
        username: "string",
      },
      media_type: "audio",
      public_bucket_path: "string",
    },
    maybe_summary_text: "string",
    maybe_thumbnail_url: "string",
    maybe_weight_data: {
      maybe_cover_image_public_bucket_path: "string",
      maybe_creator: {
        default_avatar: {
          color_index: 0,
          image_index: 0,
        },
        display_name: "string",
        gravatar_hash: "string",
        user_token: "string",
        username: "string",
      },
      title: "string",
      weight_category: "image_generation",
      weight_type: "hifigan_tt2",
    },
    stats: {
      bookmark_count: 0,
      positive_rating_count: 0,
    },
  },
  token: "string",
  updated_at: "2024-06-15T11:15:26.997Z",
};

describe("UserBookmarksApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("CreateUserBookmark", () => {
    it("success", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        new_bookmark_count_for_entity: 0,
        success: true,
        user_bookmark_token: "ubt1",
      });
      const response = await api.CreateUserBookmark({
        entityToken: "et1",
        entityType: "entt1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        data: {
          new_bookmark_count_for_entity: 0,
          user_bookmark_token: "ubt1",
        },
        success: true,
      });
    });

    it("failure", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.CreateUserBookmark({
        entityToken: "et1",
        entityType: "entt1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        data: {
          new_bookmark_count_for_entity: undefined,
          user_bookmark_token: undefined,
        },
        errorMessage: "bad input",
      });
    });

    it("exception", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.CreateUserBookmark({
        entityToken: "et1",
        entityType: "entt1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });

  describe("DeleteUserBookmark", () => {
    it("success", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
      });
      const response = await api.DeleteUserBookmark({
        entityToken: "et1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/delete/et1",
        {
          method: "DELETE",
          body: {
            as_mod: true,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
      });
    });

    it("failure", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.DeleteUserBookmark({
        entityToken: "et1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/delete/et1",
        {
          method: "DELETE",
          body: {
            as_mod: true,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "bad input",
      });
    });

    it("exception", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.DeleteUserBookmark({
        entityToken: "et1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/delete/et1",
        {
          method: "DELETE",
          body: {
            as_mod: true,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });

  describe("ListUserBookmarks", () => {
    it("success", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        bookmarks: [
          {
            entity_token: "string",
            entity_type: "user",
            is_bookmarked: true,
            maybe_bookmark_token: "string",
          },
        ],
        success: true,
      });
      const response = await api.ListUserBookmarks();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/batch",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: [
          {
            entity_token: "string",
            entity_type: "user",
            is_bookmarked: true,
            maybe_bookmark_token: "string",
          },
        ],
      });
    });

    it("failure", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.ListUserBookmarks();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/batch",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "bad input",
      });
    });

    it("exception", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.ListUserBookmarks();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/batch",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });

  describe("ListUserBookmarksByUser", () => {
    it("no params", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        pagination: {
          current: 0,
          total_page_count: 0,
        },
        results: [mockBookmark],
        success: true,
      });
      const response = await api.ListUserBookmarksByUser({});
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/list/un1",
        {
          method: "GET",
          query: {
            maybe_scoped_entity_type: undefined,
            maybe_scoped_media_file_type: undefined,
            maybe_scoped_weight_type: undefined,
            page_index: undefined,
            page_size: undefined,
            sort_ascending: undefined,
          },
        },
      );
      expect(response).toEqual({
        success: true,
        data: [mockBookmark],
        pagination: {
          current: 0,
          total_page_count: 0,
        },
      });
    });

    it("all params", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        pagination: {
          current: 0,
          total_page_count: 0,
        },
        results: [mockBookmark],
        success: true,
      });
      const response = await api.ListUserBookmarksByUser({
        username: "user1",
        sort_ascending: true,
        page_size: 76,
        page_index: 2,
        maybe_scoped_entity_type: [ScopedEntityTypes.MEDIA_FILE],
        maybe_scoped_weight_type: [
          ScopedWeightTypes.COMFY_UI,
          ScopedWeightTypes.SDXL,
        ],
        maybe_scoped_media_file_type: [
          ScopedMediaFileType.IMAGE_GENERATION,
          ScopedMediaFileType.TEXT_TO_SPEECH,
          ScopedMediaFileType.WORKFLOW_CONFIG,
        ],
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/list/user1",
        {
          method: "GET",
          query: {
            maybe_scoped_entity_type: "media_file",
            maybe_scoped_media_file_type:
              "image_generation,text_to_speech,workflow_config",
            maybe_scoped_weight_type: "comfy_ui,sdxl",
            page_index: 2,
            page_size: 76,
            sort_ascending: true,
          },
        },
      );
      expect(response).toEqual({
        success: true,
        data: [mockBookmark],
        pagination: {
          current: 0,
          total_page_count: 0,
        },
      });
    });

    it("exception", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.ListUserBookmarksByUser({});
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/list/un1",
        {
          method: "GET",
          query: {
            maybe_scoped_entity_type: undefined,
            maybe_scoped_media_file_type: undefined,
            maybe_scoped_weight_type: undefined,
            page_index: undefined,
            page_size: undefined,
            sort_ascending: undefined,
          },
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });

  describe("ListUserBookmarksByEntity", () => {
    it("success", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
        user_bookmarks: [
          {
            created_at: "2024-06-15T11:34:56.678Z",
            token: "string",
            updated_at: "2024-06-15T11:34:56.678Z",
            user: {
              default_avatar: {
                color_index: 0,
                image_index: 0,
              },
              display_name: "string",
              gravatar_hash: "string",
              user_token: "string",
              username: "string",
            },
          },
        ],
      });
      const response = await api.ListUserBookmarksByEntity({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/list/et1/tok1",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: [
          {
            created_at: "2024-06-15T11:34:56.678Z",
            token: "string",
            updated_at: "2024-06-15T11:34:56.678Z",
            user: {
              default_avatar: {
                color_index: 0,
                image_index: 0,
              },
              display_name: "string",
              gravatar_hash: "string",
              user_token: "string",
              username: "string",
            },
          },
        ],
      });
    });

    it("exception", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.ListUserBookmarksByEntity({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/list/et1/tok1",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });
});
