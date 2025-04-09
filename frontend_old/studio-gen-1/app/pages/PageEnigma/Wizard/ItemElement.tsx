import { MediaItem } from "~/pages/PageEnigma/models";
import { useSignals } from "@preact/signals-react/runtime";
import { SyntheticEvent } from "react";
import { Badge } from "~/components";
import { AssetType } from "~/enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  item: MediaItem;
  showDelete?: boolean;
}

export const ItemElement = ({ item, showDelete }: Props) => {
  useSignals();
  const defaultThumb = `/resources/images/default-covers/${(item.imageIndex || 0) % 24}.webp`;
  const thumbnail = item.thumbnail ? item.thumbnail : defaultThumb;

  return (
    <div className="group relative w-full cursor-pointer select-none overflow-hidden rounded-lg transition-all duration-200 hover:brightness-110">
      {item.media_type && !showDelete && (
        <Badge
          label={
            item.type === AssetType.OBJECT
              ? item.media_type.toUpperCase()
              : item.media_type === "fbx" ||
                  item.media_type.toLowerCase() === "glb"
                ? "Mixamo"
                : item.media_type === "pmx"
                  ? "MMD"
                  : item.media_type.toUpperCase()
          }
          className="absolute right-0 mr-[3px] mt-[3px]"
        />
      )}
      {showDelete && (
        <div className="absolute right-0 mr-[3px] mt-[3px] text-brand-primary">
          <FontAwesomeIcon icon={faTrash} />
        </div>
      )}

      <img
        crossOrigin="anonymous"
        src={thumbnail}
        onError={(e: SyntheticEvent<HTMLImageElement>) => {
          e.currentTarget.src = defaultThumb;
        }}
        alt={item.name}
        className="pointer-events-none aspect-[4.5/5] w-full select-none bg-gradient-to-b from-[#CCCCCC] to-[#A0A0A0] object-cover object-center"
      />
      <div className="pointer-events-none w-full select-none truncate bg-ui-controls px-2 py-1 text-center text-[12px] transition-all duration-200 group-hover:bg-ui-controls-button/50">
        {item.name || item.media_id}
      </div>
    </div>
  );
};
