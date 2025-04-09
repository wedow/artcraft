import React, { useRef, useState } from "react";
import MasonryGrid from "../MasonryGrid/MasonryGrid";
// import InfiniteScroll from "react-infinite-scroll-component";
import { useListContent, useSession } from "hooks";
import prepFilter from "resources/prepFilter";
import MediaCards from "../Card/MediaCards";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import { GetMediaByUser } from "@storyteller/components/src/api/media_files/GetMediaByUser";
import SkeletonCard from "components/common/Card/SkeletonCard";
import Pagination from "components/common/Pagination";

interface SelectMediaListProps {
  mediaType: string;
  listKey: string;
  onResultSelect?: (data: { token: string; title: string }) => void;
}

export default function SelectMediaList({
  mediaType,
  listKey,
  onResultSelect,
}: SelectMediaListProps) {
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [list, listSet] = useState<MediaFile[]>([]);
  const { user } = useSession();

  const media = useListContent({
    addQueries: {
      page_size: 9,
      ...prepFilter(mediaType, "filter_media_type"),
    },
    urlUpdate: false,
    debug: "Media List",
    fetcher: GetMediaByUser,
    list,
    listSet,
    requestList: true,
    urlParam: user?.username || "",
  });

  const handlePageClick = (selectedItem: { selected: number }) => {
    media.pageChange(selectedItem.selected);
  };

  const paginationProps = {
    onPageChange: handlePageClick,
    pageCount: media.pageCount,
    currentPage: media.page,
  };

  return (
    <div className="searcher-container in-modal" id={listKey}>
      <Pagination {...paginationProps} />
      {media.isLoading ? (
        <div className="row gx-3 gy-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
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
                  data,
                  showCreator: true,
                  type: "media",
                  inSelectModal: true,
                  onResultSelect,
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

      <div className="d-flex justify-content-end mt-4">
        <Pagination {...paginationProps} />
      </div>
    </div>
  );
}
