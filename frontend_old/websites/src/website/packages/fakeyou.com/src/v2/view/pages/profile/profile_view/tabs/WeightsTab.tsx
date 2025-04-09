import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MasonryGrid from "components/common/MasonryGrid/MasonryGrid";
import WeightsCards from "components/common/Card/WeightsCards";
import {
  faArrowDownWideShort,
  faFilter,
} from "@fortawesome/pro-solid-svg-icons";
import Pagination from "components/common/Pagination";
import { useBookmarks, useListContent, useRatings } from "hooks";
import { GetWeightsByUser } from "@storyteller/components/src/api/weights/GetWeightsByUser";
import { TempSelect } from "components/common";
import SkeletonCard from "components/common/Card/SkeletonCard";
import prepFilter from "resources/prepFilter";

// interface IWeighttModelData {
//   token: string;
//   weight_name: string;
//   public_bucket_path: string;
//   likes: Number;
//   isLiked: boolean;
//   created_at: string;
// }

export default function WeightsTab({ username }: { username: string }) {
  const { pathname: source, search } = useLocation();
  // const { maybe_scoped_weight_type, ...yadda } = useParams<{ maybe_scoped_weight_type: string }>();
  const urlQueries = new URLSearchParams(search);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [weightType, weightTypeSet] = useState(
    urlQueries.get("maybe_scoped_weight_type") || "all"
  );
  const [weightCategory, weightCategorySet] = useState(
    urlQueries.get("maybe_scoped_weight_category") || "all"
  );
  const [sd, sdSet] = useState("all");
  const [tts, ttsSet] = useState("all");
  const [vc, vcSet] = useState("all");
  const [showMasonryGrid, setShowMasonryGrid] = useState(true);
  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const [list, listSet] = useState<any[]>([]);
  const weights = useListContent({
    addQueries: {
      page_size: urlQueries.get("page_size") || "24",
      ...prepFilter(weightType, "maybe_scoped_weight_type"),
      ...prepFilter(weightCategory, "maybe_scoped_weight_category"),
    },
    addSetters: { sdSet, ttsSet, vcSet, weightCategorySet, weightTypeSet },
    debug: "Weights tab",
    fetcher: GetWeightsByUser,
    list,
    listSet,
    onInputChange: () => setShowMasonryGrid(false),
    onSuccess: res => {
      bookmarks.gather({ res, key: "weight_token" }); // expand rather than replace for lazy loading
      ratings.gather({ res, key: "weight_token" });
      setShowMasonryGrid(true);
    },
    requestList: true,
    urlParam: username.toLowerCase(),
  });

  const handlePageClick = (selectedItem: { selected: number }) => {
    weights.pageChange(selectedItem.selected);
  };

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
    { value: "workflow_config", label: "Workflow config" },
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

  const paginationProps = {
    onPageChange: handlePageClick,
    pageCount: weights.pageCount,
    currentPage: weights.page,
    addQueries: { page_size: 24 },
  };

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
          {weightType === "tts" && (
            <TempSelect
              {...{
                options: modelTtsOptions,
                name: "tts",
                onChange: weights.onChange,
                value: tts,
              }}
            />
          )}
          {weightType === "sd" && (
            <TempSelect
              {...{
                options: modelSdOptions,
                name: "sd",
                onChange: weights.onChange,
                value: sd,
              }}
            />
          )}
          {weightType === "vc" && (
            <TempSelect
              {...{
                options: modelVcOptions,
                name: "vc",
                onChange: weights.onChange,
                value: vc,
              }}
            />
          )}
        </div>
        <Pagination {...paginationProps} />
      </div>
      {weights.isLoading ? (
        <div className="row gx-3 gy-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <>
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
                      ratings,
                      showCreator: true,
                      type: "weights",
                      source,
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
        </>
      )}

      <div className="d-flex justify-content-end mt-4">
        <Pagination {...paginationProps} />
      </div>
    </>
  );
}
