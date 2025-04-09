import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MasonryGrid from "components/common/MasonryGrid/MasonryGrid";
import MediaCards from "components/common/Card/MediaCards";
import { Checkbox, TempSelect } from "components/common";
import {
  faArrowDownWideShort,
  faFilter,
} from "@fortawesome/pro-solid-svg-icons";
import AudioPlayerProvider from "components/common/AudioPlayer/AudioPlayerContext";
import SkeletonCard from "components/common/Card/SkeletonCard";
import Pagination from "components/common/Pagination";

import { GetMediaByUser } from "@storyteller/components/src/api/media_files/GetMediaByUser";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import { mediaClassOptions } from "components/entities/EntityTypes";
import { useBookmarks, useListContent, useLocalize, useRatings } from "hooks";
import prepFilter from "resources/prepFilter";

export default function MediaTab({ username }: { username: string }) {
  const { pathname: source, search } = useLocation();
  const urlQueries = new URLSearchParams(search);
  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [showMasonryGrid, setShowMasonryGrid] = useState(true);
  const [showUserUploads, showUserUploadsSet] = useState(true);
  const [mediaType, mediaTypeSet] = useState(
    urlQueries.get("filter_media_classes") || "unknown"
  );
  const [list, listSet] = useState<MediaFile[]>([]);

  const media = useListContent({
    addQueries: {
      include_user_uploads: showUserUploads,
      page_size: urlQueries.get("page_size") || "24",
      ...prepFilter(mediaType, "filter_media_classes"),
    },
    addSetters: { mediaTypeSet },
    // debug: "profile media",
    fetcher: GetMediaByUser,
    list,
    listSet,
    onInputChange: () => setShowMasonryGrid(false),
    onSuccess: res => {
      bookmarks.gather({ res, key: "token" });
      ratings.gather({ res, key: "token" });
      setShowMasonryGrid(true);
    },
    requestList: true,
    urlParam: username.toLowerCase(),
  });
  const { t } = useLocalize("EntityGeneral");

  const handlePageClick = (selectedItem: { selected: number }) => {
    media.pageChange(selectedItem.selected);
  };

  const paginationProps = {
    onPageChange: handlePageClick,
    pageCount: media.pageCount,
    currentPage: media.page,
  };

  const filterOptions = mediaClassOptions(t);

  const sortOptions = [
    { value: false, label: "Newest" },
    { value: true, label: "Oldest" },
    // { value: "mostliked", label: "Most Liked" },
  ];

  return (
    <>
      <div className="d-flex flex-wrap gap-3 mb-3">
        <div className="d-flex flex-grow-1 flex-wrap gap-2">
          <TempSelect
            {...{
              icon: faArrowDownWideShort,
              options: sortOptions,
              name: "sort",
              onChange: media.onChange,
              value: media.sort,
            }}
          />
          <TempSelect
            {...{
              icon: faFilter,
              options: filterOptions,
              name: "mediaType",
              onChange: media.onChange,
              value: mediaType,
            }}
          />
          <Checkbox {...{
            className: "mb-0",
            checked: showUserUploads,
            label: "Include uploads",
            onChange: ({ target }: any) => {
              media.reFetch();
              showUserUploadsSet(target.checked)
            },
            variant: "secondary"
          }} />
        </div>
        <Pagination {...paginationProps} />
      </div>
      <AudioPlayerProvider>
        {media.isLoading ? (
          <div className="row gx-3 gy-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <>
            {showMasonryGrid && (
              <>
                {media.list.length === 0 && media.status === 3 ? (
                  <div className="text-center mt-4 opacity-75">
                    No media created yet.
                  </div>
                ) : (
                  <MasonryGrid
                    gridRef={gridContainerRef}
                    onLayoutComplete={() => console.log("Layout complete!")}
                  >
                    {media.list.map((data: MediaFile, key: number) => {
                      let props = {
                        bookmarks,
                        data,
                        source,
                        ratings,
                        type: "media",
                      };
                      return (
                        <div
                          {...{
                            className:
                              "col-12 col-sm-6 col-lg-6 col-xl-4 col-xxl-3 grid-item",
                            key,
                          }}
                        >
                          <MediaCards {...{ type: data.media_type, props }} />
                        </div>
                      );
                    })}
                  </MasonryGrid>
                )}
              </>
            )}
          </>
        )}
      </AudioPlayerProvider>

      <div className="d-flex justify-content-end mt-4">
        <Pagination {...paginationProps} />
      </div>
    </>
  );
}
