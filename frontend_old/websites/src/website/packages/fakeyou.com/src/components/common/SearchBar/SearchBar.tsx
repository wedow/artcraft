import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "../Button";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import { SearchWeights } from "@storyteller/components/src/api/weights/SearchWeights";
import { Weight } from "@storyteller/components/src/api/weights/GetWeight";
import SearchResultsDropdown from "./SearchResultsDropdown";
import SearchField from "./SearchField";
import "./SearchBar.scss";
import { useHistory, useLocation } from "react-router-dom";
import debounce from "lodash.debounce";
import useGlobalSearchStore from "hooks/useGlobalSearchStore";

interface SearchBarProps {
  autoFocus?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  isFocused?: boolean;
}

export default function SearchBar({
  autoFocus,
  onBlur,
  onFocus,
  isFocused,
}: SearchBarProps) {
  let history = useHistory();
  let location = useLocation();

  const { searchTerm, setSearchTerm } = useGlobalSearchStore();
  const [foundWeights, setFoundWeights] = useState<Weight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isOnSearchPage = location.pathname.startsWith("/search");
  const previousSearchTerm = useRef<string>(searchTerm);

  const maybeSearch = useCallback(
    async (value: string) => {
      setSearchTerm(value);
    },
    [setSearchTerm]
  );

  const doSearch = useCallback(
    async (value: string) => {
      let request = {
        search_term: value,
      };

      setIsLoading(true);

      let response = await SearchWeights(request);

      if (response.success) {
        let weights = [...response.weights];
        setFoundWeights(weights);
      } else {
        setFoundWeights([]);
      }

      setIsLoading(false);
    },
    [setFoundWeights]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedDoSearch = useCallback(
    debounce(searchTerm => {
      if (
        searchTerm.trim() !== "" &&
        searchTerm !== previousSearchTerm.current
      ) {
        doSearch(searchTerm);
        previousSearchTerm.current = searchTerm;
      }
    }, 250),
    [doSearch]
  );

  useEffect(() => {
    if (isOnSearchPage) {
      const query = new URLSearchParams(location.search).get("query");
      if (query) {
        setSearchTerm(query);
      }
    }
  }, [isOnSearchPage, location.search, setSearchTerm]);

  useEffect(() => {
    if (isOnSearchPage) {
      history.push(`/search/weights?query=${encodeURIComponent(searchTerm)}`);
    } else {
      debouncedDoSearch(searchTerm);
    }
  }, [
    searchTerm,
    history,
    location.pathname,
    isOnSearchPage,
    debouncedDoSearch,
  ]);

  useEffect(() => {
    return () => {
      debouncedDoSearch.cancel();
    };
  }, [debouncedDoSearch]);

  const handleSearchButtonClick = useCallback(() => {
    if (searchTerm !== "") {
      history.push(`/search/weights?query=${encodeURIComponent(searchTerm)}`);
      previousSearchTerm.current = searchTerm;
    }
  }, [searchTerm, history]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearchButtonClick();
      }
    },
    [handleSearchButtonClick]
  );

  return (
    <div className="search-bar-container">
      <div className="search-field-group">
        <SearchField
          value={searchTerm}
          onChange={maybeSearch}
          onKeyPress={handleKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
        />
        {isFocused && !isOnSearchPage && (
          <SearchResultsDropdown
            data={foundWeights}
            isNoResults={foundWeights.length === 0 && searchTerm !== ""}
            isLoading={isLoading}
            searchTerm={searchTerm}
          />
        )}
      </div>

      <Button
        icon={faSearch}
        onClick={handleSearchButtonClick}
        variant="secondary"
        className="search-bar-button d-none d-lg-flex"
      />
    </div>
  );
}
