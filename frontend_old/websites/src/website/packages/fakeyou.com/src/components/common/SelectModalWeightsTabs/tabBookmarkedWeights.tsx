import React, { useRef, useState } from "react";
import {
  // useBookmarks,
  useListContent,
  useRatings,
  useSession,
} from "hooks";
import {
  Weight as WeightI,
  GetBookmarksByUser,
} from "@storyteller/components/src/api";
import { SelectModalData } from "../SelectModal";
import prepFilter from "resources/prepFilter";
import {
  MasonryGrid,
  WeightsCards,
  Pagination,
  SkeletonCard,
} from "components/common";

export default function WeightsTabsContent({
  debug = false,
  weightType,
  onSelect,
}: {
  debug?: boolean;
  weightType: "sd_1.5" | "loRA";
  onSelect: (data: SelectModalData) => void;
}) {
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  // const bookmarks = useBookmarks();
  const ratings = useRatings();
  const [list, listSet] = useState<WeightI[]>([]);
  const { user } = useSession();
  const weights = useListContent({
    addQueries: {
      page_size: 9,
      ...prepFilter(weightType, "weight_type"),
    },
    urlUpdate: false,
    debug: debug ? "Bookmarked Weights" : undefined,
    fetcher: GetBookmarksByUser,
    list,
    listSet,
    requestList: true,
    urlParam: user?.username || "",
  });
  const handlePageClick = (selectedItem: { selected: number }) => {
    weights.pageChange(selectedItem.selected);
  };
  // console.log("BOOKMARKED");
  // console.log(weights);
  const paginationProps = {
    onPageChange: handlePageClick,
    pageCount: weights.pageCount + 1,
    currentPage: weights.page,
  };
  if (weights.isLoading) {
    return (
      <div className="row gx-3 gy-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  } else if (weights.list.length === 0 && weights.status === 3) {
    return (
      <div className="text-center m-4 opacity-75">No weights created yet.</div>
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
          {weights.list.map((data: any, key: number) => {
            //TODO: data should be TYPED
            let props = {
              data,
              ratings,
              // bookmarks,
              showCreator: true,
              type: "weights",
              inSelectModal: true,
              onResultBookmarkSelect: onSelect,
            };
            return (
              <div
                {...{
                  className:
                    "col-12 col-sm-6 col-lg-6 col-xl-4 col-xxl-3 grid-item",
                  key,
                }}
              >
                <WeightsCards
                  {...{
                    type: data.details.maybe_weight_data.weight_category,
                    props,
                  }}
                />
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
