import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MasonryGrid from "components/common/MasonryGrid/MasonryGrid";
import MediaCards from "components/common/Card/MediaCards";
import { Button, TempSelect as Select } from "components/common";
import {
  faArrowDownWideShort,
  faFilter,
} from "@fortawesome/pro-solid-svg-icons";
import AudioPlayerProvider from "components/common/AudioPlayer/AudioPlayerContext";
import SkeletonCard from "components/common/Card/SkeletonCard";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import {
  useBookmarks,
  useLazyLists,
  useLocalize,
  useOnScreen,
  useRatings,
} from "hooks";
import InfiniteScroll from "react-infinite-scroll-component";
import prepFilter from "resources/prepFilter";
import { ListFeaturedMediaFiles } from "@storyteller/components/src/api/media_files/ListFeaturedMediaFiles";
import {
  EntityInputMode,
  EntityFilterOptions,
} from "components/entities/EntityTypes";

export default function MediaTab() {
  const { pathname: source, search } = useLocation();
  const urlQueries = new URLSearchParams(search);
  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const toTopBtnRef = useRef<HTMLDivElement | null>(null);
  const onScreen = useOnScreen(toTopBtnRef, "0px");
  const { t } = useLocalize("EntityGeneral");

  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [mediaType, mediaTypeSet] = useState(
    urlQueries.get("filter_media_type") || "video"
  );
  const [showMasonryGrid, setShowMasonryGrid] = useState(true);
  const [list, listSet] = useState<MediaFile[]>([]);
  const media = useLazyLists({
    addQueries: {
      page_size: urlQueries.get("page_size") || "24",
      ...prepFilter(mediaType, "filter_media_type"),
    },
    addSetters: { mediaTypeSet },
    fetcher: ListFeaturedMediaFiles,
    list,
    listSet,
    onInputChange: () => setShowMasonryGrid(false),
    onSuccess: res => {
      ratings.gather({ res, expand: true, key: "token" }); // expand rather than replace for lazy loading
      bookmarks.gather({ res, expand: true, key: "token" }); // expand rather than replace for lazy loading
      setShowMasonryGrid(true);
    },
    requestList: true,
  });

  const filterOptions = EntityFilterOptions(EntityInputMode.media, t);

  const sortOptions = [
    { value: false, label: "Newest" },
    { value: true, label: "Oldest" },
    // { value: "mostliked", label: "Most Liked" },
  ];

  return (
    <>
      <div className="d-flex flex-wrap gap-3 mb-3">
        <div className="d-flex flex-grow-1 flex-wrap gap-2">
          <Select
            {...{
              icon: faArrowDownWideShort,
              options: sortOptions,
              name: "sort",
              onChange: media.onChange,
              value: media.sort,
            }}
          />
          <Select
            {...{
              icon: faFilter,
              options: filterOptions,
              name: "mediaType",
              onChange: media.onChange,
              value: mediaType,
            }}
          />
        </div>
        {media.urlCursor ? (
          <div>
            <Button
              {...{
                className: `to-top-button`,
                buttonRef: toTopBtnRef,
                label: "Back to top",
                onClick: () => media.reset(),
                small: true,
              }}
            />
          </div>
        ) : null}
      </div>
      {media.urlCursor && !onScreen ? (
        <Button
          {...{
            className: `to-top-button-off-screen`,
            label: "Back to top",
            onClick: () => media.reset(),
            small: true,
          }}
        />
      ) : null}
      <AudioPlayerProvider>
        {media.isLoading && !media.list.length ? (
          <div className="row gx-3 gy-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <InfiniteScroll
            dataLength={media.list.length}
            next={media.getMore}
            hasMore={!media.list.length || !!media.next}
            loader={
              media.list.length !== 0 &&
              media.isLoading && (
                <div className="mt-4 d-flex justify-content-center">
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )
            }
            endMessage={
              <p className="text-center mt-4 opacity-75">No more results.</p>
            }
            className="overflow-hidden"
          >
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
                    {media.list.map((data: any, key: number) => {
                      let props = {
                        bookmarks,
                        data,
                        source,
                        ratings,
                        type: "media",
                        showCreator: true,
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
          </InfiniteScroll>
        )}
      </AudioPlayerProvider>
    </>
  );
}
