import { ItemElement } from "./ItemElement";
import { MediaItem } from "~/pages/PageEnigma/models";
import { dndSidePanelWidth, sidePanelWidth } from "~/pages/PageEnigma/signals";
import { H4, P, LoadingDots } from "~/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEmptySet } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  busy?: boolean;
  className?: string;
  debug?: string;
  currentPage?: number;
  pageSize?: number;
  items: MediaItem[];
}

export const ItemElements = ({
  busy,
  className,
  debug,
  items,
  currentPage,
  pageSize = 20,
}: Props) => {
  const displayWidth =
    dndSidePanelWidth.value > -1
      ? dndSidePanelWidth.value
      : sidePanelWidth.value;

  const displayItems =
    currentPage !== undefined
      ? items.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
      : items;

  function getGridColumnsClass(displayWidth: number): string {
    if (displayWidth <= 280) {
      return "grid-cols-2";
    } else if (displayWidth <= 360) {
      return "grid-cols-3";
    } else if (displayWidth <= 440) {
      return "grid-cols-4";
    } else {
      return "grid-cols-4";
    }
  }

  const gridColumnsClass = getGridColumnsClass(displayWidth);

  if (busy) {
    return (
      <div className="flex h-full w-full">
        <LoadingDots className="bg-transparent" />
      </div>
    );
  }
  if (items.length === 0 && !busy) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <FontAwesomeIcon
          icon={faEmptySet}
          className="mb-4 text-4xl opacity-30"
        />
        <H4>You do not have anything here.</H4>
        <P className="text-sm opacity-75">Please upload some assets.</P>
      </div>
    );
  }
  return (
    <div
      className={`grid ${gridColumnsClass} gap-2.5 ${className ? " " + className : ""}`}
    >
      {displayItems.map((item, index) => (
        <ItemElement debug={debug} key={index} item={item} />
      ))}
    </div>
  );
};
