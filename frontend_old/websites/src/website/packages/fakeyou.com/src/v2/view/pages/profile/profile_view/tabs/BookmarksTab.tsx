import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MasonryGrid from "components/common/MasonryGrid/MasonryGrid";
import SkeletonCard from "components/common/Card/SkeletonCard";
import { TempSelect } from "components/common";
import {
  faArrowDownWideShort,
  faFilter,
} from "@fortawesome/pro-solid-svg-icons";
import Pagination from "components/common/Pagination";

import { useBookmarks, useListContent, useRatings } from "hooks";
import { GetBookmarksByUser } from "@storyteller/components/src/api/bookmarks/GetBookmarksByUser";
import BookmarksCards from "components/common/Card/BookmarksCards";
import prepFilter from "resources/prepFilter";

export default function BookmarksTab({ username }: { username: string }) {
  const { pathname: source, search } = useLocation();
  const urlQueries = new URLSearchParams(search);
  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [showMasonryGrid, setShowMasonryGrid] = useState(true);
  const [weightType, weightTypeSet] = useState(
    urlQueries.get("maybe_scoped_weight_type") || "all"
  );
  const [sd, sdSet] = useState("all");
  const [tts, ttsSet] = useState("all");
  const [vc, vcSet] = useState("all");
  const [weightCategory, weightCategorySet] = useState(
    urlQueries.get("maybe_scoped_weight_category") || "all"
  );
  const [list, listSet] = useState<any[]>([]);
  // const resetMasonryGrid = () => {
  //   setShowMasonryGrid(false);
  //   setTimeout(() => setShowMasonryGrid(true), 10);
  // };
  const {
    // filter,
    isLoading,
    list: dataList,
    onChange,
    page,
    pageChange,
    pageCount,
    sort,
    status,
  } = useListContent({
    addQueries: {
      page_size: urlQueries.get("page_size") || "24",
      ...prepFilter(weightType, "maybe_scoped_weight_type"),
      ...prepFilter(weightCategory, "maybe_scoped_weight_category"),
    },
    addSetters: { sdSet, ttsSet, vcSet, weightCategorySet, weightTypeSet },
    // debug: "bookmarks tab",
    fetcher: GetBookmarksByUser,
    list,
    listSet,
    onInputChange: () => setShowMasonryGrid(false),
    onSuccess: res => {
      bookmarks.gather({ res, key: "entity_token" });
      ratings.gather({ res, key: "entity_token" });
      setShowMasonryGrid(true);
    },
    requestList: true,
    urlParam: username.toLowerCase(),
  });

  const handlePageClick = (selectedItem: { selected: number }) => {
    pageChange(selectedItem.selected);
  };

  const paginationProps = {
    onPageChange: handlePageClick,
    pageCount,
    currentPage: page,
  };

  // const filterOptions = [
  //   { value: "all", label: "All Weights" },
  //   { value: "tts", label: "Text to Speech" },
  //   { value: "vc", label: "Voice to Voice" },
  //   { value: "sd", label: "Image Generation" },
  // ];

  const filterOptions = [
    // these probably need beter labels
    { value: "all", label: "All weight types" },
    { value: "hifigan_tt2", label: "hifigan_tt2" },
    { value: "sd_1.5", label: "sd_1.5" },
    { value: "sdxl", label: "sdxl" },
    { value: "so_vits_svc", label: "so_vits_svc" },
    { value: "tt2", label: "tt2" },
    { value: "loRA", label: "loRA" },
    { value: "vall_e", label: "vall_e" },
  ];

  const weightCategoryOpts = [
    { value: "all", label: "All weight categories" },
    { value: "image_generation", label: "Image generation" },
    { value: "text_to_speech", label: "Text to speech" },
    { value: "vocoder", label: "Vocoder" },
    { value: "voice_conversion", label: "Voice conversion" },
  ];

  const sortOptions = [
    { value: false, label: "Newest" },
    { value: true, label: "Oldest" },
    // { value: "mostliked", label: "Most Liked" },
  ];

  const modelTtsOptions = [
    { value: "all", label: "All Types" },
    { value: "tt2", label: "Tacotron 2" },
  ];

  const modelVcOptions = [
    { value: "all", label: "All Types" },
    { value: "rvc", label: "RVCv2" },
    { value: "svc", label: "SoVitsSvc" },
  ];

  const modelSdOptions = [
    { value: "all", label: "All Types" },
    { value: "lora", label: "LoRA" },
    { value: "SD15", label: "SD 1.5" },
    { value: "SDXL", label: "SD XL" },
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
              onChange,
              value: sort,
            }}
          />
          <TempSelect
            {...{
              icon: faFilter,
              options: filterOptions,
              name: "weightType",
              onChange,
              value: weightType,
            }}
          />
          <TempSelect
            {...{
              icon: faFilter,
              options: weightCategoryOpts,
              name: "weightCategory",
              onChange,
              value: weightCategory,
            }}
          />
          {weightType === "tts" && (
            <TempSelect
              {...{
                options: modelTtsOptions,
                name: "tts",
                onChange,
                value: tts,
              }}
            />
          )}
          {weightType === "sd" && (
            <TempSelect
              {...{
                options: modelSdOptions,
                name: "sd",
                onChange,
                value: sd,
              }}
            />
          )}
          {weightType === "vc" && (
            <TempSelect
              {...{
                options: modelVcOptions,
                name: "vc",
                onChange,
                value: vc,
              }}
            />
          )}
        </div>
        <Pagination {...paginationProps} />
      </div>
      {isLoading ? (
        <div className="row gx-3 gy-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        showMasonryGrid && (
          <>
            {dataList.length === 0 && status === 3 ? (
              <div className="text-center mt-4 opacity-75">
                No bookmarked weights yet.
              </div>
            ) : (
              <MasonryGrid
                gridRef={gridContainerRef}
                onLayoutComplete={() => console.log("Layout complete!")}
              >
                {dataList.map((data: any, key: number) => {
                  let props = {
                    bookmarks,
                    data,
                    //   origin,
                    ratings,
                    showCreator: true,
                    source,
                    type:
                      data.details?.entity_type === "media_file"
                        ? "media"
                        : "weights", // this is gross, but I'm replacing all of this anyway -V
                  };

                  return (
                    <div
                      {...{
                        className:
                          "col-12 col-sm-6 col-lg-6 col-xl-4 col-xxl-3 grid-item",
                        key,
                      }}
                    >
                      <BookmarksCards
                        {...{
                          entityType: data.details?.entity_type,
                          type:
                            data.details.maybe_weight_data?.weight_category ||
                            data.details.maybe_media_file_data?.media_type,
                          props,
                        }}
                      />
                    </div>
                  );
                })}
              </MasonryGrid>
            )}
          </>
        )
      )}

      <div className="d-flex justify-content-end mt-4">
        <Pagination {...paginationProps} />
      </div>
    </>
  );
}
