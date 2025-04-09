import React, { useCallback, useEffect, useRef, useState } from "react";
import { TempInput as Input } from "components/common";
// import Input from "../Input";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import MasonryGrid from "../MasonryGrid/MasonryGrid";
import "./Searcher.scss";
import { Weight } from "@storyteller/components/src/api/weights/GetWeight";
import { useBookmarks, useLazyLists, useRatings } from "hooks";
import { SearchWeights } from "@storyteller/components/src/api/weights/SearchWeights";
import debounce from "lodash.debounce";
import WeightsCards from "../Card/WeightsCards";
import LoadingSpinner from "../LoadingSpinner";
import useSearcherStore from "hooks/useSearcherStore";
import prepFilter from "resources/prepFilter";
import { ListWeights } from "@storyteller/components/src/api/weights/ListWeights";
import InfiniteScroll from "react-infinite-scroll-component";

interface SearcherProps {
  type?: "page" | "modal";
  dataType?: "media" | "weights";
  weightType?: string;
  onResultSelect?: (data: { token: string; title: string }) => void;
  searcherKey: string;
}

export default function Searcher({
  type = "page",
  dataType = "weights",
  weightType = "all",
  onResultSelect,
  searcherKey,
}: SearcherProps) {
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const { searchTerm, setSearchTerm } = useSearcherStore();
  const [foundWeights, setFoundWeights] = useState<Weight[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(0);
  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const [list, listSet] = useState<Weight[]>([]);

  useEffect(() => {
    if (searchTerm[searcherKey]) {
      setSearchTerm(searcherKey, searchTerm[searcherKey]);
    }
    doSearch(searchTerm[searcherKey]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: any) => {
    const newValue = e.target.value;
    setSearchTerm(searcherKey, newValue);
    debouncedDoSearch(newValue);
  };

  const doSearch = useCallback(
    async (value: string) => {
      let request: any = {
        search_term: value,
      };

      setIsSearching(true);

      if (weightType !== "all") {
        request["weight_type"] = weightType;
      }

      let response = await SearchWeights(request);

      if (response.success) {
        let weights = [...response.weights];
        setFoundWeights(weights);
        setSearchCompleted(prev => prev + 1);
      } else {
        setFoundWeights([]);
      }

      setIsSearching(false);
    },
    [setFoundWeights, weightType, setSearchCompleted]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedDoSearch = useCallback(
    debounce(searchTerm => {
      doSearch(searchTerm);
    }, 250),
    [doSearch]
  );

  const weights = useLazyLists({
    addQueries: {
      page_size: 9,
      ...prepFilter(weightType, "weight_type"),
    },
    debug: "Weights List",
    fetcher: ListWeights,
    list,
    listSet,
    requestList: true,
    urlUpdate: false,
  });

  return (
    <div>
      <Input
        icon={faSearch}
        placeholder="Search..."
        value={searchTerm[searcherKey]}
        onChange={handleInputChange}
        type="text"
      />
      <div
        className={`searcher-container ${
          type === "modal" ? "in-modal" : ""
        }`.trim()}
        id={searcherKey}
      >
        {/* Result Cards */}

        {searchTerm[searcherKey] && !isSearching ? (
          <>
            {isSearching ? (
              <LoadingSpinner />
            ) : (
              <MasonryGrid key={searchCompleted} gridRef={gridContainerRef}>
                {dataType === "weights" &&
                  foundWeights.map((data: any, key: number) => {
                    let props = {
                      data,
                      ratings,
                      bookmarks,
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
        ) : (
          <>
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
              scrollableTarget={searcherKey}
              scrollThreshold={0.95}
            >
              <>
                {weights.list.length === 0 && weights.status === 3 ? (
                  <div className="text-center mt-4 opacity-75">
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
          </>
        )}
      </div>
    </div>
  );
}
