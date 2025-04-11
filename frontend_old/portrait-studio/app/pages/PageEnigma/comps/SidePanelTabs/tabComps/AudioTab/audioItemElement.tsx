import { useSignals } from "@preact/signals-react/runtime";

import { WaveformPlayer, H5, H6 } from "~/components";
import { AudioMediaItem } from "~/pages/PageEnigma/models";

import { AudioTypePill } from "./audioTypePills";
import { cancelNewFromAudioItem, updateAudioItemLength } from "~/signals";
import { updateDemoAudioItemLength } from "~/pages/PageEnigma/signals";

import DndAsset from "~/pages/PageEnigma/DragAndDrop/DndAsset";

function getGcsUrl(bucketRelativePath: string | undefined | null): string {
  const bucket = "vocodes-public";
  let path = bucketRelativePath;
  if (path !== undefined && path !== null && !path.startsWith("/")) {
    path = "/" + path;
  }
  return `https://storage.googleapis.com/${bucket}${path}`;
}

interface Props {
  item: AudioMediaItem;
}

export const AudioItemElement = ({ item }: Props) => {
  useSignals();

  return (
    <div
      className="relative w-full cursor-pointer rounded-lg transition-all duration-200"
      onPointerDown={(event) => {
        if (item.isNew) {
          cancelNewFromAudioItem(item.media_id);
        }
        DndAsset.onPointerDown(event, item);
      }}
    >
      <div className="flex w-full flex-col gap-0.5 rounded-lg bg-assets-background p-2.5">
        <div className="flex justify-between">
          <AudioTypePill category={item.category} />
          {/* <p>{item.length}</p> */}
          {item.isNew && <H6 className="text-media-is-new">New*</H6>}
        </div>

        {item.publicBucketPath && (
          <WaveformPlayer
            hasPlayButton
            audio={getGcsUrl(item.publicBucketPath)}
            onLoad={
              item.length
                ? undefined
                : ({ duration }) => {
                    // only do this for items that doesn't have a length
                    if (item.category === "demo") {
                      updateDemoAudioItemLength(item.media_id, duration * 60);
                    } else {
                      updateAudioItemLength(item.media_id, duration * 60);
                    }
                  }
            }
          />
        )}

        <H5 className="text-overflow-ellipsis">{item.name}</H5>
        {item.description && (
          <H6 className="text-overflow-ellipsis text-xs text-white/90">
            {item.description}
          </H6>
        )}
      </div>
    </div>
  );
};
