import { GetBookmarks } from "@storyteller/components/src/api/bookmarks/GetBookmarks";
import { CreateBookmark } from "@storyteller/components/src/api/bookmarks/CreateBookmark";
import { DeleteBookmark } from "@storyteller/components/src/api/bookmarks/DeleteBookmark";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faBookmark } from "@fortawesome/pro-solid-svg-icons";
import { faBookmark as faBookmarkOutline } from "@fortawesome/pro-regular-svg-icons";
import {
  useBatchContent,
  BatchInputProps,
  MakeBatchPropsParams,
} from "hooks";

export interface BookmarksProps extends BatchInputProps {
  actionType: "bookmark";
  iconOff: IconDefinition;
  iconOn: IconDefinition;
  labelOff: string | number;
  labelOn: string | number;
}

export type MakeBookmarksProps = (x: MakeBatchPropsParams) => BookmarksProps;

export default function useBookmarks() {
  const toggleList =
    (toBookmark: boolean) =>
      (res: any, entity_token: string, entity_type: string, lib: any) => {
        return {
          ...lib,
          [entity_token]: {
            entity_type,
            is_bookmarked: toBookmark,
            maybe_bookmark_token: toBookmark ? res.user_bookmark_token : null,
          },
        };
      };

  const bookmarks = useBatchContent({
    debug: "bookmarks",
    checker: ({ maybe_bookmark_token }: any) => !!maybe_bookmark_token,
    fetcher: GetBookmarks,
    onPass: {
      fetch: (entity_token: string, entity_type: string, lib: any) => {
        let bookmarkToken = lib[entity_token].maybe_bookmark_token;
        return DeleteBookmark(bookmarkToken, { as_mod: false });
      },
      modLibrary: toggleList(false),
    },
    onFail: {
      fetch: (entity_token: string, entity_type: string) =>
        CreateBookmark("", {
          entity_token,
          entity_type,
        }),
      modLibrary: toggleList(true),
    },
    resultsKey: "bookmarks",
    toggleCheck: (entity: any) => !!entity?.maybe_bookmark_token,
  });

  const makeProps: MakeBookmarksProps = ({
    entityToken,
    entityType,
  }: MakeBatchPropsParams) => {
    return {
      ...bookmarks.makeProps({ entityToken, entityType }),
      actionType: "bookmark",
      iconOff: faBookmarkOutline,
      iconOn: faBookmark,
      labelOff: "Save",
      labelOn: "Saved",
    };
  };

  return {
    ...bookmarks,
    makeProps,
  };
}
