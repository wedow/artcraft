import { ItemElement } from "./ItemElement";
import { MediaItem } from "~/pages/PageEnigma/models";
import { dndSidePanelWidth, sidePanelWidth } from "~/pages/PageEnigma/signals";
import { H4, P, LoadingDots } from "~/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEmptySet } from "@fortawesome/pro-solid-svg-icons";
import { AutoSizer, Grid } from "react-virtualized";
import "react-virtualized/styles.css";

interface Props {
  busy?: boolean;
  className?: string;
  debug?: string;
  items: MediaItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const ItemElements = ({
  busy,
  className,
  debug,
  items,
  onLoadMore,
  hasMore,
}: Props) => {
  const displayWidth =
    dndSidePanelWidth.value > -1
      ? dndSidePanelWidth.value
      : sidePanelWidth.value;

  const GRID_GAP = 8;
  const ASPECT_RATIO = 4.5 / 5;
  const TEXT_HEIGHT = 24;

  const columnCount = getGridColumns(displayWidth);
  const rowCount = Math.ceil(items.length / columnCount);

  function getGridColumns(displayWidth: number): number {
    if (displayWidth <= 280) {
      return 2;
    } else if (displayWidth <= 360) {
      return 3;
    } else if (displayWidth <= 440) {
      return 4;
    } else {
      return 4;
    }
  }

  const cellRenderer = ({
    columnIndex,
    rowIndex,
    key,
    style,
  }: {
    columnIndex: number;
    rowIndex: number;
    key: string;
    style: React.CSSProperties;
  }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= items.length) return null;

    const adjustedStyle = {
      ...style,
      padding: GRID_GAP / 2,
      height: style.height as number,
      boxSizing: "border-box" as const,
    };

    return (
      <div key={key} style={adjustedStyle}>
        <ItemElement debug={debug} item={items[index]} />
      </div>
    );
  };

  const handleScroll = ({
    clientHeight,
    scrollHeight,
    scrollTop,
  }: {
    clientHeight: number;
    scrollHeight: number;
    scrollTop: number;
  }) => {
    if (!onLoadMore || !hasMore || busy) return;

    const threshold = 100; // pixels from bottom
    const bottom = scrollHeight - clientHeight - scrollTop;
    if (bottom < threshold) {
      onLoadMore();
    }
  };

  if (busy && items.length === 0) {
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
    <div className={`h-full w-full ${className || ""}`}>
      <AutoSizer className="w-full">
        {({ height, width }) => {
          const availableWidth = width - GRID_GAP * (columnCount - 1);
          const cellWidth = Math.floor(availableWidth / columnCount);
          const imageHeight = Math.floor(cellWidth / ASPECT_RATIO);
          const cellHeight = imageHeight + TEXT_HEIGHT;

          return (
            <Grid
              cellRenderer={cellRenderer}
              columnCount={columnCount}
              columnWidth={cellWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={cellHeight}
              width={width}
              style={{ outline: "none" }}
              columnGap={GRID_GAP}
              rowGap={GRID_GAP}
              overscanRowCount={2}
              onScroll={handleScroll}
            />
          );
        }}
      </AutoSizer>
      {busy && hasMore && (
        <div className="flex w-full justify-center py-4">
          <LoadingDots className="bg-transparent" />
        </div>
      )}
    </div>
  );
};
