import { styleList } from "../data/styeList";
import { ArtStyleItem } from "./ArtStyleItem";
import { ArtStyleNames } from "../enums";

export const ArtStyleSelector = ({
  selectedArtStyle,
  onSelectedArtStyle,
}: {
  selectedArtStyle: ArtStyleNames;
  onSelectedArtStyle: (newArtStyle: ArtStyleNames) => void;
}) => {
  return (
    <div className="flex h-0 flex-auto overflow-hidden">
      <div className="w-full overflow-y-auto">
        <div className="grid w-full grid-cols-3 gap-2">
          {styleList.map((style) => (
            <ArtStyleItem
              key={style.type}
              label={style.label}
              type={style.type}
              selected={selectedArtStyle === style.type}
              onSelected={onSelectedArtStyle}
              src={style.image}
              className="aspect-video"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
