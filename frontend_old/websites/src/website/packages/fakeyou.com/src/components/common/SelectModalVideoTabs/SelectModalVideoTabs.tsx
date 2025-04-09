import React, { memo, useRef, useState } from "react";

import { useListContent, useSession } from "hooks";

import { MediaFile, GetMediaByUser } from "@storyteller/components/src/api";

import {
  MasonryGrid,
  MediaCards,
  Pagination,
  SkeletonCard,
  NonRouteTabs,
} from "components/common";

import { SelectModalData, SelectModalV2 } from "../SelectModal";

import prepFilter from "resources/prepFilter";

export default memo(function SelectModalWrapper({
  debug = false,
  value = "",
  modalTitle,
  inputLabel,
  onSelect,
}: {
  debug?: boolean;
  value?: string;
  modalTitle: string;
  inputLabel: string;
  onSelect: (data: SelectModalData) => void;
}) {
  const [onSelectTimeStamp, setOnSelectTimeStamp] = useState<Date>(new Date());
  const tabs = [
    {
      label: "All Videos",
      content: (
        <div className="searcher-container in-modal m-4" id="allVideos">
          <VideoTabsContent
            debug={debug}
            onSelect={data => {
              onSelect(data);
              setOnSelectTimeStamp(new Date());
            }}
          />
        </div>
      ),
    },
  ];
  return (
    <SelectModalV2
      modalTitle={modalTitle}
      label={inputLabel}
      value={value}
      forcedClose={onSelectTimeStamp}
      onClear={() => {
        onSelect({ title: "", token: "" });
      }}
    >
      <NonRouteTabs tabs={tabs} />
    </SelectModalV2>
  );
});

function VideoTabsContent({
  debug = false,
  onSelect,
}: {
  debug?: boolean;
  onSelect: (data: SelectModalData) => void;
}) {
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [list, listSet] = useState<MediaFile[]>([]);
  const { user } = useSession();
  const media = useListContent({
    addQueries: {
      page_size: 9,
      ...prepFilter("video", "filter_media_type"),
    },
    urlUpdate: false,
    debug: debug ? "Video List" : undefined,
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
    pageCount: media.pageCount + 1, // account for index 0
    currentPage: media.page,
  };
  if (media.isLoading) {
    return (
      <div className="row gx-3 gy-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  } else if (media.list.length === 0 && media.status === 3) {
    return (
      <div className="text-center m-4 opacity-75">No media created yet.</div>
    );
  } else {
    return (
      <>
        {paginationProps.pageCount > 1 && (
          <div className="d-flex justify-content-end mb-4">
            <Pagination {...paginationProps} />
          </div>
        )}
        <MasonryGrid
          gridRef={gridContainerRef}
          onLayoutComplete={() => {
            if (debug) console.log("Layout complete!");
          }}
        >
          {media.list.map((data: MediaFile, key: number) => {
            let props = {
              data,
              showCreator: true,
              type: "media",
              inSelectModal: true,
              onResultSelect: onSelect,
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
        {paginationProps.pageCount > 1 && (
          <div className="d-flex justify-content-end mt-4">
            <Pagination {...paginationProps} />
          </div>
        )}
      </>
    );
  }
}
