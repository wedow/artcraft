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
      className="group relative w-full cursor-pointer select-none overflow-hidden transition-all duration-200"
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

      <div className="pointer-events-none aspect-[16/12] w-full select-none overflow-hidden rounded-lg border-2 border-white/10 bg-brand-secondary-500 object-cover object-center transition-all group-hover:border-brand-primary">
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
      <div className="pointer-events-none w-full select-none truncate py-1.5 text-start text-[13px] transition-all duration-200 ">
        {item.name || item.media_id}
      </div>
    </div>
  );
};
