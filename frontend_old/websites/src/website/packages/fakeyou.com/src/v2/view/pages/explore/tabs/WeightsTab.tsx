import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MasonryGrid from "components/common/MasonryGrid/MasonryGrid";
import WeightsCards from "components/common/Card/WeightsCards";
import { Button, TempSelect } from "components/common";
import {
  faArrowDownWideShort,
  faFilter,
} from "@fortawesome/pro-solid-svg-icons";
import AudioPlayerProvider from "components/common/AudioPlayer/AudioPlayerContext";
import SkeletonCard from "components/common/Card/SkeletonCard";
import { ListWeights } from "@storyteller/components/src/api/weights/ListWeights";
import { Weight } from "@storyteller/components/src/api/weights/GetWeight";
import InfiniteScroll from "react-infinite-scroll-component";
import { useBookmarks, useLazyLists, useOnScreen, useRatings } from "hooks";
import prepFilter from "resources/prepFilter";

export default function WeightsTab() {
  const { pathname: source, search } = useLocation();
  const urlQueries = new URLSearchParams(search);
  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [weightType, weightTypeSet] = useState(
    urlQueries.get("maybe_scoped_weight_type") || "all"
  );
  const [weightCategory, weightCategorySet] = useState(
    urlQueries.get("maybe_scoped_weight_category") || "all"
  );
  const [showMasonryGrid, setShowMasonryGrid] = useState(true);
  const [list, listSet] = useState<Weight[]>([]);
  const toTopBtnRef = useRef<HTMLDivElement | null>(null);
  const onScreen = useOnScreen(toTopBtnRef, "0px");
  const weights = useLazyLists({
    addQueries: {
      page_size: urlQueries.get("page_size") || "24",
      ...prepFilter(weightType, "weight_type"),
      ...prepFilter(weightCategory, "weight_category"),
    },
    addSetters: { weightCategorySet, weightTypeSet },
    debug: "explore weights tab",
    fetcher: ListWeights,
    list,
    listSet,
    onInputChange: () => setShowMasonryGrid(false),
    onSuccess: res => {
      bookmarks.gather({ res, expand: true, key: "weight_token" }); // expand rather than replace for lazy loading
      ratings.gather({ res, expand: true, key: "weight_token" });
      setShowMasonryGrid(true);
    },
    requestList: true,
  });

  // const filterOptions = [
  //   { value: "all", label: "All Weights" },
  //   { value: "tts", label: "Text to Speech" },
  //   { value: "vc", label: "Voice to Voice" },
  //   { value: "sd", label: "Image Generation" },
  // ];

  const weightTypeOpts = [
    // these probably need beter labels
    { value: "all", label: "All weight types" },
    { value: "hifigan_tt2", label: "hifigan_tt2" },
    { value: "sd_1.5", label: "sd_1.5" },
    { value: "sdxl", label: "sdxl" },
    { value: "so_vits_svc", label: "so_vits_svc" },
    { value: "rvc_v2", label: "rvc_v2" },
    { value: "tt2", label: "tt2" },
    { value: "loRA", label: "loRA" },
    //{ value: "vall_e", label: "vall_e" }, // NB(brandon,2024-01-17): Not supported
  ];

  const weightCategoryOpts = [
    { value: "all", label: "All weight categories" },
    { value: "image_generation", label: "Image generation" },
    { value: "text_to_speech", label: "Text to speech" },
    { value: "vocoder", label: "Vocoder" },
    { value: "voice_conversion", label: "Voice conversion" },
    { value: "workflow_config", label: "Workflow config" },
  ];

  const sortOptions = [
    { value: false, label: "Newest" },
    { value: true, label: "Oldest" },
    // { value: "mostliked", label: "Most Bookmarked" },
  ];

  // const modelTtsOptions = [
  //   { value: "all", label: "All Types" },
  //   { value: "tt2", label: "Tacotron 2" },
  // ];

  // const modelVcOptions = [
  //   { value: "all", label: "All Types" },
  //   { value: "rvc", label: "RVCv2" },
  //   { value: "svc", label: "SoVitsSvc" },
  // ];

  // const modelSdOptions = [
  //   { value: "all", label: "All Types" },
  //   { value: "lora", label: "LoRA" },
  //   { value: "SD15", label: "SD 1.5" },
  //   { value: "SDXL", label: "SD XL" },
  // ];

  return (
    <>
      <div className="d-flex flex-wrap gap-3 mb-3">
        <div className="d-flex flex-grow-1 flex-wrap gap-2">
          <TempSelect
            {...{
              icon: faArrowDownWideShort,
              options: sortOptions,
              name: "sort",
              onChange: weights.onChange,
              value: weights.sort,
            }}
          />
          <TempSelect
            {...{
              icon: faFilter,
              options: weightCategoryOpts,
              name: "weightCategory",
              onChange: weights.onChange,
              value: weightCategory,
            }}
          />
          <TempSelect
            {...{
              icon: faFilter,
              options: weightTypeOpts,
              name: "weightType",
              onChange: weights.onChange,
              value: weightType,
            }}
          />
          {/* {selectedFilter === "tts" && (
            <TempSelect
              options={modelTtsOptions}
              defaultValue={modelTtsOptions[0]}
              isSearchable={false}
            />
          )}
          {selectedFilter === "sd" && (
            <Select
              options={modelSdOptions}
              defaultValue={modelSdOptions[0]}
              isSearchable={false}
            />
          )}
          {selectedFilter === "vc" && (
            <Select
              options={modelVcOptions}
              defaultValue={modelVcOptions[0]}
              isSearchable={false}
            />
          )} */}
        </div>

        {weights.urlCursor ? (
          <div>
            <Button
              {...{
                className: `to-top-button`,
                buttonRef: toTopBtnRef,
                label: "Back to top",
                onClick: () => weights.reset(),
                small: true,
              }}
            />
          </div>
        ) : null}
      </div>
      {weights.urlCursor && !onScreen ? (
        <Button
          {...{
            className: `to-top-button-off-screen`,
            label: "Back to top",
            onClick: () => weights.reset(),
            small: true,
          }}
        />
      ) : null}
      <AudioPlayerProvider>
        {weights.isLoading && !weights.list.length ? (
          <div className="row gx-3 gy-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
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
          >
            {showMasonryGrid && (
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
                        bookmarks,
                        data,
                        source,
                        ratings,
                        showCreator: true,
                        type: "weights",
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
            )}
          </InfiniteScroll>
        )}
      </AudioPlayerProvider>
    </>
  );
}
