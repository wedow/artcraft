import React, { useRef, useState, useEffect } from "react";
import { useBookmarks, useLazyLists, useRatings } from "hooks";

import {
  FetchStatus,
  Weight as WeightI,
  ListWeights,
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
  const pageSize = 9;
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const [list, listSet] = useState<WeightI[]>([]);
  const [lazyPages, setLazyPages] = useState<{
    currPageWeights: any[];
    currPageIndex: number;
    pageLookup: string[];
    hasNext: boolean;
  }>({
    currPageWeights: [],
    currPageIndex: 0,
    pageLookup: [],
    hasNext: true,
  });
  const { currPageWeights, currPageIndex, pageLookup } = lazyPages;

  const weights = useLazyLists({
    addQueries: {
      page_size: pageSize,
      ...prepFilter(weightType, "weight_type"),
    },
    fetcher: ListWeights,
    onSuccess: res => {
      if (debug) console.log(res);
      //case of first load
      if (currPageWeights.length === 0) {
        setLazyPages(prev => ({
          currPageWeights: [...res.results],
          currPageIndex: 0,
          hasNext: true,
          pageLookup: [...prev.pageLookup, res.pagination.maybe_next],
        }));
      }
      //case of last page
      if (res.results.length === 0) {
        setLazyPages(prevState => ({
          ...prevState,
          hasNext: false,
        }));
      }
    },
    list,
    listSet,
    requestList: true,
    urlUpdate: false,
  });

  useEffect(() => {
    if (
      weights.next &&
      lazyPages.hasNext &&
      (currPageIndex + 1) * pageSize >= weights.list.length &&
      weights.status === FetchStatus.success
    ) {
      //preload nextPage
      // if(debug) console.log('useEffect: getMore')
      weights.getMore();
    }
  }, [weights, currPageIndex, lazyPages.hasNext]);

  const handlePageChange = (selectedItem: { selected: number }) => {
    if (debug) console.log(`selected page: ${selectedItem.selected}`);
    const startIdx = selectedItem.selected * 9;
    const endIdx =
      (selectedItem.selected + 1) * 9 <= weights.list.length
        ? (selectedItem.selected + 1) * 9
        : weights.list.length;
    if (debug) console.log(`should slice ${startIdx}-${endIdx}`);
    if (debug) console.log(weights.list);
    setLazyPages(prevState => ({
      ...prevState,
      currPageWeights: weights.list.slice(startIdx, endIdx),
      currPageIndex: selectedItem.selected,
    }));
    // }
  };

  const paginationProps = {
    onPageChange: handlePageChange,
    pageCount: pageLookup.length + 1,
    currentPage: currPageIndex,
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
        <div className="d-flex justify-content-end mb-4">
          <Pagination {...paginationProps} />
        </div>
        <MasonryGrid
          gridRef={gridContainerRef}
          onLayoutComplete={() => {
            if (debug) console.log("Layout complete!");
          }}
        >
          {currPageWeights.map((data: any, key: number) => {
            let props = {
              data,
              ratings,
              bookmarks,
              showCreator: true,
              type: "weights",
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
                <WeightsCards {...{ type: data.weight_category, props }} />
              </div>
            );
          })}
        </MasonryGrid>
        <div className="d-flex justify-content-end mt-4">
          <Pagination {...paginationProps} />
        </div>
      </>
    );
  }
}
