import React from "react";
import moment from "moment";
import { MakeRatingsProps } from "hooks/useRatings";
import AudioPlayer from "components/common/AudioPlayer";
import CardBadge from "../CardBadge";
import CardFooter from "../CardFooter";

interface Props {
  data: any,
  makeRatingsProps?: MakeRatingsProps,
  showCreator?: boolean
}

export default function AudioCard({ data, makeRatingsProps, showCreator }: Props) {
  const { created_at, media_type, public_bucket_path, origin: entityOrigin, token } = data || {}
  const timeCreated = moment( created_at || "").fromNow();
  return  <>
      <div {...{ className: "mb-3" }}>
        <CardBadge {...{ className: `fy-entity-type${ media_type ? "-" + media_type : "" }`, label: media_type }}/>
        <h6 {...{ className: "fw-semibold text-white mb-1 mt-3" }}>
          { entityOrigin.maybe_model ? entityOrigin.maybe_model.title : "Media Audio" }
        </h6>
        <p {...{ className: "fs-7 opacity-75" }}>{ timeCreated }</p>
      </div>
      <AudioPlayer {...{ src: public_bucket_path, id: `fy-audio-card-${token}` }}/>
      <CardFooter {...{
        creator: data?.maybe_creator, 
        entityToken: data.token,
        entityType: "media_file",
        makeRatingsProps
      }}/>
    </>;
};