import React, { useRef, useState } from "react";
import MasonryGrid from "../MasonryGrid/MasonryGrid";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  useBookmarks,
  useLazyLists,
  useListContent,
  useRatings,
  useSession,
} from "hooks";
import prepFilter from "resources/prepFilter";
import WeightsCards from "../Card/WeightsCards";
import { ListWeights } from "@storyteller/components/src/api/weights/ListWeights";
import { Weight } from "@storyteller/components/src/api/weights/GetWeight";
import { GetBookmarksByUser } from "@storyteller/components/src/api/bookmarks/GetBookmarksByUser";
import Pagination from "../Pagination";

interface SelectWeightsListProps {
  weightType: string | "all";
  listKey: string;
  onResultSelect?: (data: { token: string; title: string }) => void;
  onResultBookmarkSelect?: (data: { token: string; title: string }) => void;
  onlyBookmarked?: boolean;
}

export default function SelectWeightsList({
  weightType,
  listKey,
  onResultSelect,
  onResultBookmarkSelect,
  onlyBookmarked,
}: SelectWeightsListProps) {
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef2 = useRef<HTMLDivElement | null>(null);
  const [list, listSet] = useState<Weight[]>([]);
  const [bookmarksList, setBookmarksList] = useState<Weight[]>([]);
  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const { user } = useSession();
  const [showBookmarksMasonryGrid, setShowBookmarksMasonryGrid] =
    useState(false);
  const handlePageClick = (selectedItem: { selected: number }) => {
    pageChange(selectedItem.selected);
  };

  //weights
  const weights = useLazyLists({
    addQueries: {
      page_size: 9,
      ...prepFilter(weightType, "weight_type"),
    },
    fetcher: ListWeights,
    list,
    listSet,
    requestList: true,
    urlUpdate: false,
  });

  //bookmarks
  const { isLoading, page, pageChange, pageCount, status } = useListContent({
    addQueries: {
      page_size: 9,
      ...prepFilter(weightType, "maybe_scoped_weight_type"),
    },
    fetcher: GetBookmarksByUser,
    onSuccess: res => {
      setShowBookmarksMasonryGrid(true);
    },
    list: bookmarksList,
    debug: "bookmarks tab",
    listSet: setBookmarksList,
    requestList: true,
    urlParam: user.username,
    urlUpdate: false,
  });

  const paginationProps = {
    onPageChange: handlePageClick,
    pageCount,
    currentPage: page,
  };

  return (
    <div className="searcher-container in-modal" id={listKey}>
      {onlyBookmarked ? (
        <>
          <div className="d-flex flex-wrap gap-3 mb-3">
            <Pagination {...paginationProps} />
          </div>
          <>
            {isLoading ? (
              <div className="mt-4 d-flex justify-content-center">
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {bookmarksList.length === 0 && status === 3 ? (
                  <div className="text-center mt-4 opacity-75">
                    No bookmarked weights yet.
                  </div>
                ) : (
                  <>
                    {showBookmarksMasonryGrid &&
                      Array.isArray(bookmarksList) && (
                        <MasonryGrid
                          gridRef={gridContainerRef2}
                          onLayoutComplete={() =>
                            console.log("Layout complete!")
                          }
                        >
                          {bookmarksList.map((data: any, key: number) => {
                            let weightProps = {
                              bookmarks,
                              data,
                              ratings,
                              type: "weights",
                              inSelectModal: true,
                              onResultBookmarkSelect,
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
                                    type: data.details.maybe_weight_data
                                      .weight_category,
                                    props: weightProps,
                                  }}
                                />
                                {/* <MediaCards
                        {...{ type: data.media_type, props: mediaProps }}
                      /> */}
                              </div>
                            );
                          })}
                        </MasonryGrid>
                      )}
                  </>
                )}
              </>
            )}
          </>

          <div className="d-flex justify-content-end mt-4">
            <Pagination {...paginationProps} />
          </div>
        </>
      ) : (
        <InfiniteScroll
          dataLength={weights.list.length}
          next={weights.getMore}
          hasMore={!weights.list.length || !!weights.next}
          loader={
            weights.list.length !== 0 &&
            weights.isLoading && (
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
          scrollableTarget={listKey}
          scrollThreshold={0.95}
        >
          <>
            {weights.list.length === 0 && weights.status === 3 ? (
              <div className="text-center opacity-75">
                No weight created yet.
              </div>
            ) : (
              <MasonryGrid
                gridRef={gridContainerRef}
                onLayoutComplete={() => console.log("Layout complete!")}
              >
                {weights.list.map((data: any, key: number) => {
                  let props = {
                    data,
                    ratings,
                    bookmarks,
                    showCreator: true,
                    type: "weights",
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
                      <WeightsCards
                        {...{ type: data.weight_category, props }}
                      />
                    </div>
                  );
                })}
              </MasonryGrid>
            )}
          </>
        </InfiniteScroll>
      )}
    </div>
  );
}
