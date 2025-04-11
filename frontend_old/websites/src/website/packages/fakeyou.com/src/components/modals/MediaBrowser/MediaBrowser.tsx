import React, { useState } from "react";
import { MediaList } from "components/entities";
import {
  AcceptTypes,
  EntityInputMode,
  EntityFilterOptions,
} from "components/entities/EntityTypes";
import {
  Checkbox,
  LoadingSpinner,
  ModalUtilities,
  Pagination,
  TempSelect as Select,
} from "components/common";
import AudioPlayerProvider from "components/common/AudioPlayer/AudioPlayerContext";
import SkeletonCard from "components/common/Card/SkeletonCard";
import { GetBookmarksByUser } from "@storyteller/components/src/api/bookmarks/GetBookmarksByUser";
import { GetMediaByUser } from "@storyteller/components/src/api/media_files/GetMediaByUser";
import { GetWeightsByUser } from "@storyteller/components/src/api/weights/GetWeightsByUser";
import { SearchWeight } from "@storyteller/components/src/api/weights/Search";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import { Weight } from "@storyteller/components/src/api/weights/GetWeight";
import {
  useDebounce,
  useListContent,
  // useRatings
} from "hooks";
import {
  faArrowDownWideShort,
  faFilter,
  faGlobe,
} from "@fortawesome/pro-solid-svg-icons";
import prepFilter from "resources/prepFilter";
import ModalHeader from "../ModalHeader";
import "./MediaBrowser.scss";
import {
  LanguageLabels,
  LanguageTag,
} from "@storyteller/components/src/api/Languages";

const n = () => {};

export interface MediaBrowserProps {
  accept?: AcceptTypes[];
  inputMode: EntityInputMode;
  onSearchChange?: (e: any) => void;
  onSelect?: any;
  owner?: string;
  search?: string;
  username: string;
  emptyContent?: React.ReactNode;
  showFilters?: boolean;
  showPagination?: boolean;
  searchFilter?: string;
  showUserUploadCheckbox?: boolean;
  showTypeFilter?: boolean;
  showSearchFilters?: boolean;
}

interface MediaBrowserInternal extends ModalUtilities, MediaBrowserProps {}

export default function MediaBrowser({
  accept,
  handleClose = n,
  inputMode,
  onSearchChange = n,
  onSelect,
  owner,
  search,
  username,
  emptyContent,
  showFilters = true,
  showPagination = true,
  searchFilter = "text_to_speech", // Default
  showUserUploadCheckbox = true,
  showTypeFilter = true,
  showSearchFilters = false,
}: MediaBrowserInternal) {
  // const ratings = useRatings();
  const [showMasonryGrid, setShowMasonryGrid] = useState(true);
  const [filterType, filterTypeSet] = useState(accept ? accept[0] : "all");
  const [list, listSet] = useState<MediaFile | Weight[]>([]);
  const [localSearch, localSearchSet] = useState(search);
  const [searchUpdated, searchUpdatedSet] = useState(false);
  const [showUserUploads, showUserUploadsSet] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageTag | null>(
    null
  );
  const [sortField, setSortField] = useState("bestMatch");
  const [isSearching, isSearchingSet] = useState(false);

  const fetcher = [
    GetBookmarksByUser,
    GetMediaByUser,
    GetWeightsByUser,
    SearchWeight,
  ][inputMode];

  const getSortParams = (selectedValue: string) => {
    switch (selectedValue) {
      case "bestMatch":
        return { sort_field: "match_score", sort_direction: null };
      case "mostUsed":
        return { sort_field: "usage_count", sort_direction: "descending" };
      case "newest":
        return { sort_field: "created_at", sort_direction: "descending" };
      case "oldest":
        return { sort_field: "created_at", sort_direction: "ascending" };
      case "bestRated":
        return {
          sort_field: "positive_rating_count",
          sort_direction: "descending",
        };
      case "featured":
      default:
        return { sort_field: null, sort_direction: null };
    }
  };

  const sortParams = getSortParams(sortField);

  const entities = useListContent({
    // debug: "media browser",
    addQueries: {
      ...(showUserUploadCheckbox && { include_user_uploads: showUserUploads }),
      ...(localSearch
        ? {
            ...(sortParams.sort_field !== null && {
              sort_field: sortParams.sort_field,
            }),
            ...(sortParams.sort_direction !== null && {
              sort_direction: sortParams.sort_direction,
            }),
            search_term: localSearch,
            weight_category: searchFilter,
            ...(selectedLanguage !== null && {
              ietf_language_subtag: selectedLanguage,
            }),
          }
        : {}),
      ...prepFilter(
        filterType,
        [
          "maybe_scoped_weight_type",
          "filter_media_type",
          "maybe_scoped_weight_type",
          "weight_category",
        ][inputMode]
      ),
    },
    addSetters: { filterTypeSet },
    fetcher,
    list,
    listSet,
    onInputChange: () => setShowMasonryGrid(false),
    onSuccess: res => {
      setShowMasonryGrid(true);
    },
    requestList: true,
    ...(localSearch ? { resultsKey: "weights" } : {}),
    urlParam: owner || username || "",
    urlUpdate: false,
  });

  useDebounce({
    blocked: !searchUpdated,
    onTimeout: () => {
      searchUpdatedSet(false);
      isSearchingSet(false);
      entities.reFetch();
    },
  });

  const localSearchChange = ({ target }: { target: any }) => {
    isSearchingSet(true);
    searchUpdatedSet(true);
    // entities.reFetch();
    onSearchChange({ target });
    localSearchSet(target.value);
  };

  const handlePageClick = (selectedItem: { selected: number }) => {
    entities.pageChange(selectedItem.selected);
  };

  const paginationProps = {
    onPageChange: handlePageClick,
    pageCount: entities.pageCount,
    currentPage: entities.page,
  };

  const sortOptions = [
    // { value: "featured", label: "Featured" },
    { value: "bestMatch", label: "Best Match" },
    { value: "mostUsed", label: "Most Used" },
    { value: "bestRated", label: "Best Rated" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
  ];

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSortField(selectedValue);
    getSortParams(selectedValue);
    entities.reFetch();
  };

  const languageOptions = [
    { value: "all", label: "All Languages" },
    ...Object.entries(LanguageLabels).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const onwerTxt = (entityName: string) =>
    `${owner ? owner + "'s " : ""}${entityName}`;

  const title = [
    onwerTxt("Bookmarks"),
    onwerTxt("Media"),
    onwerTxt("Weights"),
    "Search",
  ][inputMode];

  const onClick = (data: any) => {
    onSelect(data);
    handleClose();
  };

  const filterOptions = accept
    ? accept.map((value: string) => ({
        value,
        label: value,
      }))
    : EntityFilterOptions(inputMode);

  return (
    <>
      <ModalHeader
        {...{
          onSearchChange: localSearchChange,
          handleClose,
          search: localSearch,
          title,
        }}
      >
        {showFilters || showPagination ? (
          <>
            {showFilters && (
              <>
                {showUserUploadCheckbox && (
                  <Checkbox
                    className="mb-0"
                    checked={showUserUploads}
                    label="Show my uploads"
                    onChange={({ target }: any) => {
                      entities.reFetch();
                      showUserUploadsSet(target.checked);
                    }}
                    variant="secondary"
                  />
                )}

                {showSearchFilters && (
                  <div className="d-flex gap-2">
                    <Select
                      icon={faArrowDownWideShort}
                      options={sortOptions}
                      name="sortField"
                      onChange={handleSortChange}
                      value={sortField}
                    />

                    <Select
                      icon={faGlobe}
                      options={languageOptions}
                      name="language"
                      onChange={(selectedOption: any) => {
                        const value = selectedOption.target.value;
                        setSelectedLanguage(
                          value === "all" ? null : (value as LanguageTag)
                        );
                        entities.reFetch();
                      }}
                      value={selectedLanguage || "all"}
                    />
                  </div>
                )}

                {((showTypeFilter && !accept) || (accept && accept.length)) && (
                  <Select
                    icon={faFilter}
                    options={filterOptions}
                    name="filterType"
                    onChange={entities.onChange}
                    value={filterType}
                  />
                )}
              </>
            )}
            {showPagination && <Pagination {...paginationProps} />}
          </>
        ) : null}
      </ModalHeader>
      <AudioPlayerProvider>
        {entities.isLoading ? (
          <div {...{ className: "row gx-3 gy-3" }}>
            {Array.from({ length: 12 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <>
            {showMasonryGrid && (
              <div {...{ className: "fy-media-browser-list" }}>
                <MediaList
                  {...{
                    entityType: 2,
                    list: entities.list,
                    success: entities.status === 3,
                    onClick,
                    emptyContent:
                      localSearch === "" ? (
                        emptyContent
                      ) : (
                        <>
                          {isSearching ? (
                            <LoadingSpinner className="mt-5" />
                          ) : (
                            <div className="text-center mt-4 opacity-75">
                              No results found.
                            </div>
                          )}
                        </>
                      ),
                  }}
                />
              </div>
            )}
          </>
        )}
      </AudioPlayerProvider>

      <footer
        {...{ className: "fy-media-browser-footer fy-media-browser-tools" }}
      >
        {showPagination && <Pagination {...paginationProps} />}
      </footer>
    </>
  );
}
