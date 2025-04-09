import React, { useEffect, useRef } from "react";
import Masonry from "masonry-layout";
import imagesLoaded from "imagesloaded";

interface MasonryGridProps {
  children: React.ReactNode;
  onLayoutComplete?: () => void;
  gridRef: React.RefObject<HTMLDivElement>;
}

export default function MasonryGrid({
  children,
  onLayoutComplete,
  gridRef,
}: MasonryGridProps) {
  const masonryInstance = useRef<Masonry | null>(null);

  useEffect(() => {
    if (gridRef.current) {
      masonryInstance.current = new Masonry(gridRef.current, {
        itemSelector: ".grid-item",
        percentPosition: true,
        transitionDuration: 0,
      });
    }

    return () => {
      if (
        masonryInstance.current &&
        typeof masonryInstance.current.destroy === "function"
      ) {
        masonryInstance.current.destroy();
      }
    };
  }, [gridRef]);

  useEffect(() => {
    const currentGrid = gridRef.current;
    const currentMasonryInstance = masonryInstance.current;

    if (currentGrid && currentMasonryInstance) {
      imagesLoaded(currentGrid, function () {
        if (typeof currentMasonryInstance.layout === "function") {
          currentMasonryInstance.layout();
          onLayoutComplete?.();
        }
      });
    }
  }, [gridRef, onLayoutComplete]);

  useEffect(() => {
    const currentGrid = gridRef.current;
    const currentMasonryInstance = masonryInstance.current;

    if (currentGrid && currentMasonryInstance) {
      // Observer to detect when new grid items are added
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length) {
            // Append new items to the Masonry layout
            const newItems = Array.from(mutation.addedNodes).filter(
              node =>
                node instanceof HTMLElement &&
                node.classList.contains("grid-item")
            );
            if (newItems.length) {
              if (typeof currentMasonryInstance.appended === "function") {
                currentMasonryInstance.appended(newItems);
              }
            }
          }
        });
      });

      // Observe the grid for new items
      observer.observe(currentGrid, {
        childList: true,
      });

      // Clean up observer on unmount
      return () => {
        observer.disconnect();
      };
    }
  }, [gridRef]);

  return (
    <div
      ref={gridRef}
      className="row gy-3 gx-3"
      data-masonry='{"percentPosition": true}'
      style={{ marginBottom: "1px" }}
    >
      {children}
    </div>
  );
}
