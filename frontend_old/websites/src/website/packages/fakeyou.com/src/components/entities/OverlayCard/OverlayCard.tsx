import React from "react";
import moment from "moment";
import { MakeRatingsProps } from "hooks/useRatings";
import CardBadge from "../CardBadge";
import CardFooter from "../CardFooter";

interface Props {
  data: any;
  hover: boolean;
  makeRatingsProps?: MakeRatingsProps;
  preview: React.ElementType;
  showCreator?: boolean;
}

export default function OverlayCard({
  data,
  hover,
  makeRatingsProps,
  preview: Preview,
  showCreator,
}: Props) {
  const timeCreated = moment(data.created_at || "").fromNow();

  return (
    <>
      <Preview {...{ data, hover }} />
      <div {...{ className: "card-img-overlay" }}>
        <div className="card-img-gradient" />
        <CardBadge
          {...{
            className: `fy-entity-type${
              data.media_type ? "-" + data.media_type : ""
            }`,
            label: data.media_type,
          }}
        />
      </div>
      <div className="card-img-overlay-text">
        <div>
          <p className="fs-7 opacity-75 mb-0">{timeCreated}</p>
        </div>
        <CardFooter
          {...{
            creator: data?.maybe_creator,
            entityToken: data.token,
            entityType: "media_file",
            makeRatingsProps,
            showCreator,
          }}
        />
      </div>
    </>
  );
}
