import { useEffect, useState } from "react";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { useHistory, useLocation } from "react-router-dom";

interface Props {
  addQueries?: any;
  addSetters?: any;
  debug?: string;
  fetcher: any;
  list: any;
  listSet: any;
  onInputChange?: (x?: any) => any;
  onSuccess?: (x?: any) => any;
  requestList?: boolean;
  urlUpdate?: boolean;
}

const n = () => {};

export default function useLazyLists({
  addQueries,
  addSetters,
  debug = "",
  fetcher,
  list = [],
  listSet,
  onInputChange = n,
  onSuccess = n,
  requestList = false,
  urlUpdate = true,
}: Props) {
  const { pathname, search: locSearch } = useLocation();
  const history = useHistory();
  const urlQueries = new URLSearchParams(locSearch);
  const urlCursor = urlQueries.get("cursor");
  const [next, nextSet] = useState(urlCursor || "");
  const [previous, previousSet] = useState(""); // I am not used for anything yet :)
  const [sort, sortSet] = useState(urlQueries.get("sort_ascending") === "true");
  const [status, statusSet] = useState(
    requestList ? FetchStatus.ready : FetchStatus.paused
  );
  const listKeys = Object.keys(list);
  const totalKeys = listKeys.length;
  const isLoading =
    status === FetchStatus.ready || status === FetchStatus.in_progress;
  const fetchError = status === FetchStatus.error;

  const [goingtToTop,goingtToTopSet] = useState(false);
  const [y,ySet] = useState(0);

  const getMore = () => {
    if (next) statusSet(1);
  };

  const onChange = ({ target }: { target: { name: string; value: any } }) => {
    const todo: { [key: string]: (x: any) => void } = {
      ...addSetters,
      sortSet,
    };
    todo[target.name + "Set"](target.value);
    onInputChange({ target });
    listSet([]); // Reset list on filter/sort change
    nextSet("");
    previousSet("");
    statusSet(FetchStatus.ready);
  };

  const reset = () => {
    listSet([]); // Reset list on filter/sort change
    nextSet("");
    previousSet("");
    statusSet(FetchStatus.ready);
    window.scrollTo(0,0);
    goingtToTopSet(true);
  }

  useEffect(() => {
    const queries = {
      ...(next ? { cursor: next } : {}),
      ...addQueries, // eventually we should provide a way to type this ... or not. It works
      ...(sort ? { sort_ascending: true } : {}),
    };

    const adjustY = () => ySet(window.pageYOffset);

    if (goingtToTop) {
      window.addEventListener('scroll', adjustY, { passive: true });
      if (y === 0) setTimeout(() => goingtToTopSet(false),500);
    }
    else window.removeEventListener('scroll',adjustY);

    if (status === FetchStatus.ready && !goingtToTop) {
      let search = new URLSearchParams(queries).toString();
      statusSet(FetchStatus.in_progress);
      if (urlUpdate) { history.replace({ pathname, search }); }

      fetcher("", {}, queries).then((res: any) => {
        if (debug)
          console.log(`🐞 useLazyLists success debug at: ${debug}`, res);
        statusSet(FetchStatus.success);
        onSuccess(res);
        if (res.results && res.pagination) {
          listSet((prevObj: any) => {
            let keyExists = listKeys.find(
              key => key.split("#")[1] === res.pagination.maybe_next
            );
            if (!next && !totalKeys) {
              return { [0 + "#initial"]: res.results }; // save as object so we can track what has been loaded
            } else if (!keyExists) {
              return {
                ...prevObj,
                [`${totalKeys}#${next}`]: res.results,
              };
            } else {
              // Key exists, just update the existing data
              const updatedObj = { ...prevObj };
              updatedObj[keyExists] = res.results;
              return updatedObj;
            }
          });
          nextSet(res.pagination.maybe_next || "");
          previousSet(res.pagination.maybe_previous);
        }
      });
    }
  }, [
    addQueries,
    debug,
    fetcher,
    goingtToTop,
    history,
    listKeys,
    listSet,
    next,
    onSuccess,
    pathname,
    sort,
    status,
    totalKeys,
    urlUpdate,
    y
  ]);

  return {
    fetchError,
    getMore,
    isLoading,
    list: Object.values(list).flat(), // format as an array, eventually the input list will live within this hook. Eventually
    listKeys,
    next,
    onChange,
    previous,
    reset,
    sort,
    sortSet,
    status,
    statusSet,
    totalKeys,
    urlCursor
  };
}
