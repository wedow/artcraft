import React, { useCallback, useEffect, useRef, useState } from "react";
import Container from "components/common/Container";
import PageHeader from "components/layout/PageHeader";
import Panel from "components/common/Panel";
import { SearchWeights } from "@storyteller/components/src/api/weights/SearchWeights";
import { Weight } from "@storyteller/components/src/api/weights/GetWeight";
import { useHistory, useLocation } from "react-router-dom";
import debounce from "lodash.debounce";
import MasonryGrid from "components/common/MasonryGrid/MasonryGrid";
import WeightsCards from "components/common/Card/WeightsCards";
import { useBookmarks, useRatings } from "hooks";
import {
  faFilter,
  faLanguage,
  faTag,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import Select from "components/common/Select";
import { AVAILABLE_TTS_LANGUAGE_CATEGORY_MAP } from "_i18n/AvailableLanguageMap";
import { Button } from "components/common";

export default function SearchPage() {
  const [foundWeights, setFoundWeights] = useState<Weight[]>([]);
  const [weightType, setWeightType] = useState<string>("all");
  const [weightCategory, setWeightCategory] = useState<string>("all");
  const [searchCompleted, setSearchCompleted] = useState(0);
  const [weightTypeOpts, setWeightTypeOpts] = useState([
    { value: "all", label: "All Types" },
  ]);
  const [language, setLanguage] = useState<string>("all");

  const bookmarks = useBookmarks();
  const ratings = useRatings();
  const history = useHistory();
  const location = useLocation();

  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const useQuery = () => {
    return new URLSearchParams(useLocation().search);
  };

  const query = useQuery();
  const urlSearchTerm = query.get("query") || "";
  const urlWeightType = query.get("type") || "all";
  const urlWeightCategory = query.get("category") || "all";
  const urlLanguage = query.get("language") || "all";

  const doSearch = useCallback(
    async (
      searchTerm,
      weightTypeFilter,
      weightCategoryFilter,
      languageFilter
    ) => {
      let request = {
        search_term: searchTerm,
        weight_type: weightTypeFilter !== "all" ? weightTypeFilter : undefined,
        weight_category:
          weightCategoryFilter !== "all" ? weightCategoryFilter : undefined,
        ietf_language_subtag:
          languageFilter !== "all" ? languageFilter : undefined,
      };

      let response = await SearchWeights(request);

      if (response.success) {
        let weights = [...response.weights];
        setFoundWeights(weights);
        setSearchCompleted(prev => prev + 1);
      } else {
        setFoundWeights([]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setFoundWeights, weightType, weightCategory, language]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedDoSearch = useCallback(
    debounce(
      (searchTerm, weightTypeFilter, weightCategoryFilter, languageFilter) => {
        doSearch(
          searchTerm,
          weightTypeFilter,
          weightCategoryFilter,
          languageFilter
        );
      },
      250
    ),
    [doSearch]
  );

  useEffect(() => {
    if (urlSearchTerm) {
      debouncedDoSearch(
        urlSearchTerm,
        urlWeightType,
        urlWeightCategory,
        urlLanguage
      );
    }
  }, [
    urlSearchTerm,
    urlWeightType,
    urlWeightCategory,
    urlLanguage,
    debouncedDoSearch,
  ]);

  let languageOpts = Object.entries(AVAILABLE_TTS_LANGUAGE_CATEGORY_MAP).map(
    ([languageCode, language]) => {
      let label = `${language.languageName}`;

      if (language.languageNameLocalized !== undefined) {
        label = `${language.languageNameLocalized} / ${label}`;
      }

      if (language.flags.length > 0) {
        label += ` ${language.flags.join(" ")}`;
      }

      return {
        value: languageCode,
        label: label,
      };
    }
  );

  languageOpts = [
    {
      label: `All Languages`,
      value: "all",
    },
    ...languageOpts,
  ];

  const weightCategoryOpts = [
    { value: "all", label: "All Categories" },
    { value: "image_generation", label: "Image Generation" },
    { value: "text_to_speech", label: "Text to Speech" },
    { value: "vocoder", label: "Vocoder" },
    { value: "voice_conversion", label: "Voice Conversion" },
  ];

  const updateWeightTypeOpts = useCallback(category => {
    switch (category) {
      case "image_generation":
        setWeightTypeOpts([
          { value: "all", label: "All Types" },
          { value: "sd_1.5", label: "SD 1.5" },
          { value: "sdxl", label: "SDXL" },
          { value: "loRA", label: "LoRA" },
        ]);
        break;
      case "text_to_speech":
        setWeightTypeOpts([
          { value: "all", label: "All Types" },
          { value: "tt2", label: "TT2" },
          { value: "hifigan_tt2", label: "HiFiGAN TT2" },
        ]);
        break;
      case "voice_conversion":
        setWeightTypeOpts([
          { value: "all", label: "All Types" },
          { value: "so_vits_svc", label: "SVC" },
          { value: "rvc_v2", label: "RVC v2" },
        ]);
        break;
      default:
        setWeightTypeOpts([
          { value: "all", label: "All Types" },
          { value: "hifigan_tt2", label: "HiFiGAN TT2" },
          { value: "sd_1.5", label: "SD 1.5" },
          { value: "sdxl", label: "SDXL" },
          { value: "so_vits_svc", label: "SVC" },
          { value: "rvc_v2", label: "RVC v2" },
          { value: "tt2", label: "TT2" },
          { value: "loRA", label: "LoRA" },
        ]);
    }
  }, []);

  // Update weight type options when weight category changes
  useEffect(() => {
    updateWeightTypeOpts(weightCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightCategory]);

  const weightTypeValue =
    weightTypeOpts.find(el => el.value === weightType) || weightTypeOpts[0];

  const weightCategoryValue =
    weightCategoryOpts.find(el => el.value === weightCategory) ||
    weightCategoryOpts[0];

  const languageValue =
    languageOpts.find(el => el.value === language) || languageOpts[0];

  // update URL query parameters
  const updateQueryParams = (params: any) => {
    const searchParams = new URLSearchParams(location.search);
    Object.keys(params).forEach(key => {
      if (params[key] === "all") {
        searchParams.delete(key);
      } else {
        searchParams.set(key, params[key]);
      }
    });
    history.push({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
  };

  // Set initial filter states from URL query parameters
  useEffect(() => {
    setWeightType(query.get("type") || "all");
    setWeightCategory(query.get("category") || "all");
    setLanguage(query.get("language") || "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when filters change
  useEffect(() => {
    updateQueryParams({
      query: urlSearchTerm,
      type: weightType,
      category: weightCategory,
      language: language,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightType, weightCategory, language, urlSearchTerm]);

  const isFilterApplied =
    weightType !== "all" || weightCategory !== "all" || language !== "all";

  const handleClearFilters = () => {
    setWeightType("all");
    setWeightCategory("all");
    setLanguage("all");

    const updatedSearchParams = new URLSearchParams();
    if (urlSearchTerm !== "") updatedSearchParams.set("query", urlSearchTerm);

    history.push({
      pathname: location.pathname,
      search: updatedSearchParams.toString(),
    });

    doSearch(urlSearchTerm, "all", "all", "all");
  };

  return (
    <Container type="panel" className="mb-5">
      <PageHeader
        title={`${foundWeights.length || "0"} results for "${urlSearchTerm}"`}
        titleH2={true}
        // extension={tags}
        panel={false}
      />
      <Panel padding={true}>
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <Select
            {...{
              icon: faLanguage,
              options: languageOpts,
              name: "languages",
              value: languageValue,
              defaultValue: languageOpts[0],
              onChange: args => {
                setLanguage(args.value);
              },
            }}
          />
          <Select
            {...{
              icon: faTag,
              options: weightCategoryOpts,
              name: "weightCategory",
              value: weightCategoryValue,
              defaultValue: weightCategoryOpts[0],
              onChange: args => {
                setWeightCategory(args.value);
              },
            }}
          />
          <Select
            {...{
              icon: faFilter,
              options: weightTypeOpts,
              name: "weightType",
              defaultValue: weightTypeOpts[0],
              value: weightTypeValue,
              onChange: args => {
                setWeightType(args.value);
              },
            }}
          />
          {isFilterApplied && (
            <Button
              variant="link"
              icon={faXmark}
              label="Reset Filters"
              className="ms-2"
              onClick={handleClearFilters}
            />
          )}
        </div>

        <MasonryGrid
          key={searchCompleted}
          gridRef={gridContainerRef}
          onLayoutComplete={() => console.log("Layout complete!")}
        >
          {foundWeights.map((data: any, key: number) => {
            let props = {
              data,
              bookmarks,
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
                <WeightsCards {...{ type: data.weight_category, props }} />
              </div>
            );
          })}
        </MasonryGrid>
      </Panel>
    </Container>
  );
}
