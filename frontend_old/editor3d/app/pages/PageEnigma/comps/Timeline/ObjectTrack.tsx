import { updateObject } from "~/pages/PageEnigma/signals";
import { TrackKeyFrames } from "~/pages/PageEnigma/comps/Timeline/TrackKeyFrames";
import { ClipGroup } from "~/enums";
import { ObjectTrack } from "~/pages/PageEnigma/models";

interface Props {
  object: ObjectTrack;
}

export const ObjectTrackComponent = ({ object }: Props) => {
  return (
    <TrackKeyFrames
      id={object.object_uuid}
      keyframes={object.keyframes}
      updateKeyframe={updateObject}
      group={ClipGroup.OBJECT}
    />
  );
};
