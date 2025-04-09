import { Weight } from "@storyteller/components/src/api/weights/GetWeight";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import Badge from "../Badge";
import useWeightTypeInfo from "hooks/useWeightTypeInfo";

interface SearchResultsDropdownProps {
  data: Weight[];
  isNoResults?: boolean;
  isLoading?: boolean;
  searchTerm?: string;
}

export default function SearchResultsDropdown({
  data,
  isNoResults,
  isLoading,
  searchTerm,
}: SearchResultsDropdownProps) {
  const history = useHistory();

  const handleInnerClick = (event: any) => {
    event.stopPropagation();
  };

  const handleMouseDown = (event: any, url: string) => {
    history.push(url);
  };

  const handleUrlPush = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (searchTerm) {
      history.push(`/search/weights?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <>
      {data.length !== 0 && (
        <div className="search-results-dropdown">
          {data.slice(0, 6).map((item: any) => {
            const { label: weightBadgeLabel, color: weightBadgeColor } =
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useWeightTypeInfo(item.weight_type);

            return (
              <Link
                to={`/weight/${item.weight_token}`}
                key={item.weight_token}
                onMouseDown={event =>
                  handleMouseDown(event, `/weight/${item.weight_token}`)
                }
              >
                <div className="search-results-dropdown-item p-3">
                  <h6 className="fw-semibold mb-1 text-white">{item.title}</h6>
                  <div className="d-flex gap-2 align-items-center">
                    <p className="fs-7">
                      by{" "}
                      <Link
                        className="fw-medium"
                        to={`/profile/${item.creator.username}`}
                        onClick={handleInnerClick}
                      >
                        {item.creator.display_name}
                      </Link>
                    </p>
                    <Badge
                      label={weightBadgeLabel}
                      color={weightBadgeColor}
                      small={true}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
          <div
            className="search-results-dropdown-item view-more p-3"
            onClick={handleUrlPush}
          >
            View more results
          </div>
        </div>
      )}

      {isLoading && isNoResults && (
        <div className="search-results-dropdown">
          <div className="search-results-dropdown-item p-3 loading-results">
            <div className="text-center">
              <div
                className="spinner-border spinner-border-md opacity-75"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {data.length === 0 && !isLoading && isNoResults && (
        <div className="search-results-dropdown">
          <div className="search-results-dropdown-item p-3 no-results">
            No results found
          </div>
        </div>
      )}
    </>
  );
}
