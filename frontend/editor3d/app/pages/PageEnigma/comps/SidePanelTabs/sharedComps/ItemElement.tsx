import { MediaItem } from "~/pages/PageEnigma/models";
import { useSignals } from "@preact/signals-react/runtime";
import DndAsset from "~/pages/PageEnigma/DragAndDrop/DndAsset";
import { Badge } from "~/components";
import { AssetType } from "~/enums";
import { useState } from "react";

interface Props {
  debug?: string;
  item: MediaItem;
}

const mapCharacterObejctType = (mediaType: string) => {
  const typeCased = mediaType.toLowerCase();
  switch (typeCased) {
    case "fbx":
    case "glb": {
      return "Mixamo";
    }
    case "pmx": {
      return "MMD";
    }
    default: {
      return typeCased.toUpperCase();
    }
  }
};
const patchExpressionObjectType = (mediaType: string) => {
  const typeCased = mediaType.toLowerCase();
  if (typeCased === "vmd") {
    return "Mixamo";
  }
  return typeCased.toUpperCase();
};

export const ItemElement = ({ item }: Props) => {
  useSignals();
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="group relative w-full cursor-pointer select-none overflow-hidden rounded-lg transition-all duration-200 hover:brightness-110"
      onPointerDown={(event) => DndAsset.onPointerDown(event, item)}
    >
      {item.media_type && (
        <Badge
          label={
            item.type === AssetType.CHARACTER
              ? mapCharacterObejctType(item.media_type)
              : item.type === AssetType.EXPRESSION
                ? patchExpressionObjectType(item.media_type)
                : item.media_type.toUpperCase()
          }
          className="absolute right-0 mr-[3px] mt-[3px]"
        />
      )}

      <div className="pointer-events-none aspect-[4.5/5] w-full select-none bg-brand-secondary-500 object-cover object-center">
        {item.thumbnail && !imageError && (
          <img
            crossOrigin="anonymous"
            src={item.thumbnail}
            alt={item.name}
            className="h-full w-full object-cover object-center"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <div className="pointer-events-none w-full select-none truncate bg-brand-secondary-950 px-2 py-1 text-center text-[12px] transition-all duration-200 group-hover:bg-brand-secondary-800">
        {item.name || item.media_id}
      </div>
    </div>
  );
};
