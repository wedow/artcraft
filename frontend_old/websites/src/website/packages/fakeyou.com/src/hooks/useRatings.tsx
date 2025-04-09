import { GetRatings } from "@storyteller/components/src/api/user_ratings/GetRatings";
import { SetRating } from "@storyteller/components/src/api/user_ratings/SetRating";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faHeart } from "@fortawesome/pro-solid-svg-icons";
import { faHeart as faHeartOutline } from "@fortawesome/pro-regular-svg-icons";
import {
  useBatchContent,
  BatchInputProps,
  MakeBatchPropsParams,
} from "hooks";

export interface RatingsProps extends BatchInputProps {
  actionType: "like";
  iconOff: IconDefinition;
  iconOn: IconDefinition;
  likeCount: 0;
  labelOff: string | number;
  labelOn: string | number;
}

export type MakeRatingsProps = (x: MakeBatchPropsParams) => RatingsProps;

export default function useRatings() {
  const fetch = (entity_token: string, entity_type: string, lib: any) => {
    const newRating = {
      entity_token,
      entity_type,
      rating_value:
        lib[entity_token]?.rating_value !== "positive" ? "positive" : "neutral",
    };
    return SetRating("", newRating);
  };

  const modLibrary = (
    res: any,
    entity_token: string,
    entity_type: string,
    lib: any
  ) => {
    return {
      ...lib,
      [entity_token]: {
        entity_type,
        rating_value:
          lib[entity_token].rating_value === "neutral" ? "positive" : "neutral",
        positive_rating_count: res.new_positive_rating_count_for_entity,
      },
    };
  };

  const ratings = useBatchContent({
    fetcher: GetRatings,
    checker: () => true,
    // debug: "useRatings",
    modLibrary: (
      current: any,
      res: any,
      entity_token: string,
      tokenType: string
    ) => {
      let result = res.results
        ? res.results.find((item: any, i: number) => {
          return (item.details || item)[tokenType] === entity_token;
        })
        : res;

      let { positive_rating_count } = (result.details || result).stats;

      return { ...current, positive_rating_count };
    },
    onFail: { fetch, modLibrary },
    onPass: { fetch, modLibrary },
    resultsKey: "ratings",
    toggleCheck: (entity: any) => (entity?.rating_value || "") === "positive",
  });

  const makeProps: MakeRatingsProps = ({
    entityToken,
    entityType,
  }: MakeBatchPropsParams) => {
    const likeCount = ratings.library[entityToken]?.positive_rating_count || 0;
    return {
      ...ratings.makeProps({ entityToken, entityType }),
      actionType: "like",
      iconOn: faHeart,
      iconOff: faHeartOutline,
      labelOff: likeCount,
      labelOn: likeCount,
      likeCount,
    };
  };

  return {
    ...ratings,
    makeProps,
  };
}
